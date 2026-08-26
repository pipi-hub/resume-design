import mammoth from "mammoth";

export async function extractTextFromFile(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType?: string,
): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // 1. Plain text or Markdown
  if (mimeType?.includes("text") || ext === "txt" || ext === "md" || ext === "json") {
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(fileBuffer);
  }

  // 2. DOCX documents
  if (
    ext === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
      return result.value.trim();
    } catch (err) {
      console.warn("DOCX extraction error:", err);
    }
  }

  // 3. PDF documents (extract text stream / pdfjs)
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

      if (fullText.trim().length > 20) {
        return fullText.trim();
      }
    } catch (pdfErr) {
      console.warn("PDF extraction fallback:", pdfErr);
      // Fallback: extract ASCII printable strings from raw buffer
      const decoder = new TextDecoder("latin1");
      const raw = decoder.decode(fileBuffer);
      const textChunks: string[] = [];
      const regex = /BT[\s\S]*?ET|\((.*?)\)Tj|\[(.*?)\]TJ/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(raw)) !== null) {
        if (match[1]) textChunks.push(match[1]);
        if (match[2]) textChunks.push(match[2].replace(/-\d+/g, " "));
      }
      if (textChunks.length > 5) {
        return textChunks
          .join(" ")
          .replace(/\\([()\\])/g, "$1")
          .trim();
      }
    }
  }

  // Fallback to text decoding
  try {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(fileBuffer);
    // eslint-disable-next-line no-control-regex
    const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ").trim();
    if (cleaned.length > 50) return cleaned;
  } catch (e) {
    console.warn("Text decoding error:", e);
  }

  return "Resume uploaded: " + fileName;
}
