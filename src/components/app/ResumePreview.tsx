import React, { forwardRef } from "react";
import type { ResumeFormData } from "@/lib/pdf-export";

interface ResumePreviewProps {
  form: ResumeFormData;
  template: string;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ form, template }, ref) => {
    const isClassic = template === "Classic";
    const isModern = template === "Modern";
    const isStudent = template === "Student";
    const isMinimal = template === "Minimal" || (!isClassic && !isModern && !isStudent);

    // Section ordering based on template
    const sections = isStudent
      ? [
          { key: "summary", label: "Professional Summary", value: form.summary },
          { key: "education", label: "Education & Coursework", value: form.education },
          { key: "projects", label: "Projects & Engineering Portfolio", value: form.projects },
          { key: "experience", label: "Experience & Internships", value: form.experience },
          { key: "skills", label: "Technical Skills", value: form.skills },
        ]
      : [
          { key: "summary", label: "Summary", value: form.summary },
          { key: "education", label: "Education", value: form.education },
          { key: "experience", label: "Experience", value: form.experience },
          { key: "projects", label: "Projects", value: form.projects },
          { key: "skills", label: "Skills", value: form.skills },
        ];

    // Helper to format content into paragraphs or structured bullets
    const renderContent = (content: string, isSkillSection: boolean) => {
      if (!content || !content.trim()) return null;

      if (isSkillSection) {
        const skillsList = content
          .split(/[,•|\n]+/)
          .map((s) => s.trim())
          .filter(Boolean);

        if (isModern) {
          return (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skillsList.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          );
        }

        return (
          <p className="text-[11.5px] leading-relaxed text-slate-700">{skillsList.join("  •  ")}</p>
        );
      }

      const lines = content.split("\n");
      const elements: React.ReactNode[] = [];
      let currentBulletGroup: string[] = [];

      const flushBullets = () => {
        if (currentBulletGroup.length > 0) {
          elements.push(
            <ul
              key={`bullets-${elements.length}`}
              className="list-disc pl-4 space-y-1 text-[11.5px] leading-relaxed text-slate-700"
            >
              {currentBulletGroup.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>,
          );
          currentBulletGroup = [];
        }
      };

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          flushBullets();
          return;
        }

        const isBullet =
          trimmed.startsWith("•") ||
          trimmed.startsWith("-") ||
          trimmed.startsWith("*") ||
          trimmed.startsWith("–");

        if (isBullet) {
          currentBulletGroup.push(trimmed.replace(/^[•\-*–]\s*/, ""));
        } else {
          flushBullets();
          elements.push(
            <p
              key={`p-${elements.length}`}
              className="text-[11.5px] leading-relaxed text-slate-800 font-normal"
            >
              {trimmed}
            </p>,
          );
        }
      });

      flushBullets();
      return <div className="space-y-1.5">{elements}</div>;
    };

    return (
      <div
        ref={ref}
        id="resume-export-sheet"
        className={`resume-document bg-white text-slate-900 mx-auto w-full p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 transition-all ${
          isClassic
            ? "font-serif"
            : isModern
              ? "font-sans border-t-4 border-t-indigo-600"
              : "font-sans"
        }`}
        style={{
          minHeight: "297mm",
          maxWidth: "210mm",
          boxSizing: "border-box",
        }}
      >
        {/* Header Block */}
        <header
          className={`pb-4 border-b ${
            isClassic
              ? "text-center border-slate-300"
              : isModern
                ? "border-slate-200"
                : "border-slate-300"
          }`}
          style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
        >
          <h1
            className={`font-bold tracking-tight text-slate-900 ${
              isClassic
                ? "text-2xl tracking-wide uppercase font-serif"
                : isModern
                  ? "text-2xl font-sans"
                  : "text-2xl font-sans uppercase"
            }`}
          >
            {form.name || "Your Name"}
          </h1>

          {form.role && (
            <p
              className={`font-semibold mt-0.5 ${
                isModern
                  ? "text-sm text-indigo-600 uppercase tracking-wide"
                  : isClassic
                    ? "text-sm text-slate-700 italic"
                    : "text-sm text-slate-800"
              }`}
            >
              {form.role}
            </p>
          )}

          <div
            className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 ${
              isClassic ? "justify-center" : "justify-start"
            }`}
          >
            {[form.email, form.phone, form.location].filter(Boolean).map((info, idx, arr) => (
              <span key={idx} className="flex items-center gap-2">
                <span>{info}</span>
                {idx < arr.length - 1 && <span className="text-slate-300">•</span>}
              </span>
            ))}
          </div>

          {form.links && (
            <p
              className={`text-[11px] text-slate-600 mt-1 ${
                isClassic ? "text-center" : "text-left"
              }`}
            >
              {form.links}
            </p>
          )}
        </header>

        {/* Sections Container */}
        <div className="mt-5 space-y-4">
          {sections.map(
            (sec) =>
              sec.value &&
              sec.value.trim() && (
                <section
                  key={sec.key}
                  className="space-y-1.5"
                  style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
                >
                  <div
                    className={`flex items-center justify-between pb-1 border-b ${
                      isModern
                        ? "border-indigo-100"
                        : isClassic
                          ? "border-slate-300"
                          : "border-slate-200"
                    }`}
                  >
                    <h2
                      className={`text-[11.5px] font-bold uppercase tracking-wider ${
                        isModern
                          ? "text-indigo-900 border-l-2 border-indigo-600 pl-2"
                          : isClassic
                            ? "text-slate-900 font-serif"
                            : "text-slate-900"
                      }`}
                    >
                      {sec.label}
                    </h2>
                  </div>

                  <div className="pt-0.5">{renderContent(sec.value, sec.key === "skills")}</div>
                </section>
              ),
          )}
        </div>
      </div>
    );
  },
);

ResumePreview.displayName = "ResumePreview";
