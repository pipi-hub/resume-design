import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export type ResumeFormData = {
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  links: string;
  summary: string;
  education: string;
  experience: string;
  projects: string;
  skills: string;
};

export interface ExportPdfOptions {
  fileName?: string;
  element: HTMLElement;
  formData: ResumeFormData;
  templateName?: string;
}

/**
 * High-fidelity PDF exporter for ResuMate Resume Builder.
 * Captures the rendered resume element using html2canvas and jsPDF with
 * automatic multi-page slicing, margin handling, and a rock-solid vector jsPDF fallback.
 */
export async function exportResumeToPDF({
  fileName,
  element,
  formData,
  templateName = "Minimal",
}: ExportPdfOptions): Promise<{ success: boolean; fallbackUsed?: boolean }> {
  const safeFileName =
    fileName ||
    `${(formData.name || "resume").toLowerCase().replace(/[^a-z0-9_-]/g, "-")}-resume.pdf`;

  try {
    // 1. Primary Strategy: High-resolution canvas capture
    // Temporarily ensure the element is visible and styled for A4 capture
    const originalScrollPos = window.scrollY;

    const canvas = await html2canvas(element, {
      scale: 2, // 2x DPI for crisp text and graphics
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1024,
    });

    window.scrollTo(0, originalScrollPos);

    // Standard A4 dimensions in mm
    const pdfPageWidth = 210;
    const pdfPageHeight = 297;
    const margin = 0; // The resume DOM container already encapsulates page padding

    const imgWidth = pdfPageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Check if the resume content fits on one page (with 3mm tolerance)
    if (imgHeight <= pdfPageHeight + 3) {
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, Math.min(imgHeight, pdfPageHeight));
    } else {
      // Multi-page export: slice the canvas cleanly into A4 page sections
      const pageCanvasHeight = (canvas.width * pdfPageHeight) / pdfPageWidth;
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        const currentSliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
        sliceCanvas.height = currentSliceHeight;

        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            currentSliceHeight,
            0,
            0,
            sliceCanvas.width,
            currentSliceHeight,
          );
        }

        const sliceImgData = sliceCanvas.toDataURL("image/jpeg", 0.98);
        const sliceMmHeight = (currentSliceHeight * imgWidth) / canvas.width;
        pdf.addImage(sliceImgData, "JPEG", margin, margin, imgWidth, sliceMmHeight);

        renderedHeight += pageCanvasHeight;
        pageIndex++;
      }
    }

    pdf.save(safeFileName);
    return { success: true, fallbackUsed: false };
  } catch (canvasErr) {
    console.warn("HTML2Canvas PDF generation failed, switching to vector jsPDF:", canvasErr);

    // 2. Reliable Secondary Fallback: Vector jsPDF generator
    // Ensures the user always receives a clean downloadable PDF regardless of sandbox constraints
    generateVectorPdfFallback(formData, safeFileName, templateName);
    return { success: true, fallbackUsed: true };
  }
}

/**
 * Fallback vector PDF generator using pure jsPDF commands.
 * Formats all sections cleanly on standard A4 with proper fonts, margins, and page breaks.
 */
export function generateVectorPdfFallback(
  formData: ResumeFormData,
  fileName: string,
  templateName: string,
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  const isClassic = templateName === "Classic";
  const isStudent = templateName === "Student";
  const fontFamily = isClassic ? "times" : "helvetica";

  // Header: Name
  doc.setFont(fontFamily, "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(formData.name || "Your Name", margin, y);
  y += 7;

  // Header: Role
  doc.setFont(fontFamily, "normal");
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text(formData.role || "Software Engineer", margin, y);
  y += 6;

  // Header: Contact
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  const contactLine = [formData.email, formData.phone, formData.location]
    .filter(Boolean)
    .join("  |  ");
  if (contactLine) {
    doc.text(contactLine, margin, y);
    y += 4.5;
  }
  if (formData.links) {
    doc.text(formData.links, margin, y);
    y += 4.5;
  }

  // Header Divider
  y += 2;
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  const addSection = (title: string, content: string) => {
    if (!content || !content.trim()) return;

    checkPageBreak(16);

    // Section Header
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), margin, y);
    y += 2.5;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4.5;

    // Content Lines
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    const rawLines = content.split("\n");
    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        y += 2;
        continue;
      }

      const isBullet =
        trimmed.startsWith("•") ||
        trimmed.startsWith("-") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("–");

      const lineText = isBullet ? trimmed.replace(/^[•\-*–]\s*/, "") : trimmed;
      const bulletIndent = isBullet ? 4 : 0;
      const textWidth = contentWidth - bulletIndent;

      const wrapped = doc.splitTextToSize(lineText, textWidth);

      checkPageBreak(wrapped.length * 4.5 + 2);

      if (isBullet) {
        doc.setFont(fontFamily, "bold");
        doc.text("•", margin, y);
        doc.setFont(fontFamily, "normal");
      }

      doc.text(wrapped, margin + bulletIndent, y);
      y += wrapped.length * 4.5 + 1.5;
    }

    y += 4;
  };

  // Order sections according to template
  if (isStudent) {
    addSection("Summary", formData.summary);
    addSection("Education & Relevant Coursework", formData.education);
    addSection("Projects & Technical Portfolio", formData.projects);
    addSection("Experience & Internships", formData.experience);
    addSection("Technical Skills & Proficiencies", formData.skills);
  } else {
    addSection("Professional Summary", formData.summary);
    addSection("Education", formData.education);
    addSection("Experience", formData.experience);
    addSection("Projects", formData.projects);
    addSection("Technical Skills", formData.skills);
  }

  doc.save(fileName);
}
