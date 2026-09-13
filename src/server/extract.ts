import mammoth from "mammoth";

export async function extractTextFromFile(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType?: string,
): Promise<string> {
  if (!fileBuffer || fileBuffer.byteLength === 0) {
    throw new Error(`The file "${fileName}" is empty (0 bytes). Please upload a valid document.`);
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // 1. Plain text or Markdown documents
  if (mimeType?.includes("text") || ext === "txt" || ext === "md") {
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(fileBuffer).trim();
    if (!text || text.length < 10) {
      throw new Error(
        `The file "${fileName}" contains insufficient or empty text. Please upload a comprehensive resume.`,
      );
    }
    // Guard against someone renaming a binary PDF to .txt
    if (text.startsWith("%PDF-")) {
      throw new Error(
        `"${fileName}" appears to be a PDF renamed to .txt. Please upload it with a .pdf extension.`,
      );
    }
    return text;
  }

  // 2. DOCX documents
  if (
    ext === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
      const text = result.value.trim();
      if (text.length >= 20) {
        return text;
      }
      throw new Error(
        `The Word document "${fileName}" appears to be empty or contains only non-extractable images.`,
      );
    } catch (err) {
      if (err instanceof Error && err.message.includes("empty")) {
        throw err;
      }
      throw new Error(
        `Failed to parse Word document "${fileName}". Please ensure it is an uncorrupted, standard .docx file.`,
      );
    }
  }

  // 3. PDF documents (extract text stream via pdfjs)
  if (ext === "pdf" || mimeType === "application/pdf") {
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const uint8 = new Uint8Array(fileBuffer);
      const loadingTask = pdfjs.getDocument({
        data: uint8,
        useSystemFonts: true,
        disableFontFace: true,
      });
      const pdfDoc = await loadingTask.promise;
      let fullText = "";

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => item.str || "")
          .join(" ");
        fullText += pageText + "\n\n";
      }

      const cleaned = fullText
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      // Check if we extracted meaningful alphanumeric content
      const alphanumericCount = (cleaned.match(/[a-zA-Z0-9]/g) || []).length;
      if (cleaned.length >= 30 && alphanumericCount >= 20 && !cleaned.startsWith("%PDF-")) {
        return cleaned;
      }

      throw new Error(
        `Could not extract text from "${fileName}". The PDF appears to be a scanned image or contains no selectable text layer. Please upload a text-based PDF or DOCX resume.`,
      );
    } catch (pdfErr) {
      if (pdfErr instanceof Error && pdfErr.message.includes("scanned image")) {
        throw pdfErr;
      }
      throw new Error(
        `Could not extract text from "${fileName}". The document may be corrupted, password-protected, or a scanned image. Please upload a selectable text PDF or DOCX file.`,
      );
    }
  }

  throw new Error(
    `Unsupported file format for "${fileName}". Please upload a PDF, DOCX, TXT, or MD resume file.`,
  );
}
