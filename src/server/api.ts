import {
  analyzeResumeWithGemini,
  improveBulletWithGemini,
  generateCoverLetterWithGemini,
  generateInterviewQuestionsWithGemini,
  evaluateInterviewAnswerWithGemini,
  aiChatWithGemini,
} from "./gemini";
import { extractTextFromFile } from "./extract";

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!path.startsWith("/api/")) {
    return null;
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (path === "/api/health" && request.method === "GET") {
      return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (path === "/api/extract" && request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";
      let fileName = "resume.pdf";
      let mimeType = "application/pdf";
      let buffer: ArrayBuffer;

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
          return new Response(JSON.stringify({ error: "No file uploaded" }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        fileName = file.name;
        mimeType = file.type;
        buffer = await file.arrayBuffer();
      } else {
        const body = await request.json();
        fileName = body.fileName || "resume.pdf";
        mimeType = body.mimeType || "application/pdf";
        const base64 = body.base64 || "";
        const binary = atob(base64.replace(/^data:.*?;base64,/, ""));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        buffer = bytes.buffer;
      }

      const text = await extractTextFromFile(buffer, fileName, mimeType);
      return new Response(JSON.stringify({ text, fileName }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (path === "/api/analyze" && request.method === "POST") {
      const body = await request.json();
      const { resumeText, jobDescription, jobTitle, company, careerLevel } = body;
      if (!resumeText) {
        return new Response(JSON.stringify({ error: "resumeText is required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const result = await analyzeResumeWithGemini({
        resumeText,
        jobDescription,
        jobTitle,
        company,
        careerLevel,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (path === "/api/improve-bullet" && request.method === "POST") {
      const body = await request.json();
      const { bullet, targetRole, context } = body;
      if (!bullet) {
        return new Response(JSON.stringify({ error: "bullet is required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const res = await improveBulletWithGemini({ bullet, targetRole, context });
      return new Response(
        JSON.stringify({
          result: res.improvedBullet || res.result,
          improvedBullet: res.improvedBullet || res.result,
          optionalEnhancement: res.optionalEnhancement,
          isAlreadyStrong: res.isAlreadyStrong,
          statusNote: res.statusNote,
          provider: res.provider,
          modelUsed: res.modelUsed,
          attempts: res.attempts,
        }),
        {
          status: 200,
          headers: corsHeaders,
        },
      );
    }

    if (path === "/api/generate-cover-letter" && request.method === "POST") {
      const body = await request.json();
      const { resumeText, jobTitle, company, tone, highlight } = body;
      if (!jobTitle || !company) {
        return new Response(JSON.stringify({ error: "jobTitle and company are required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const res = await generateCoverLetterWithGemini({
        resumeText: resumeText || "",
        jobTitle,
        company,
        tone,
        highlight,
      });

      return new Response(
        JSON.stringify({
          letter: res.letter,
          provider: res.provider,
          modelUsed: res.modelUsed,
          attempts: res.attempts,
        }),
        {
          status: 200,
          headers: corsHeaders,
        },
      );
    }

    if (path === "/api/generate-interview-prep" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const { resumeText, jobDescription, targetRole } = body;

      if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
        return new Response(
          JSON.stringify({
            error: "Please select or upload a resume before generating interview questions.",
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const questions = await generateInterviewQuestionsWithGemini({
        resumeText: resumeText.trim(),
        jobDescription: typeof jobDescription === "string" ? jobDescription : undefined,
        targetRole: typeof targetRole === "string" ? targetRole : undefined,
      });

      return new Response(JSON.stringify(questions), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (path === "/api/evaluate-interview-answer" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const { question, answer, category, targetRole, resumeText } = body;

      if (!question || !answer || typeof answer !== "string" || !answer.trim()) {
        return new Response(
          JSON.stringify({
            error: "Both question and a non-empty answer are required for evaluation.",
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const evaluation = await evaluateInterviewAnswerWithGemini({
        question: String(question),
        answer: String(answer).trim(),
        category: category ? String(category) : undefined,
        targetRole: targetRole ? String(targetRole) : undefined,
        resumeText: resumeText ? String(resumeText) : undefined,
      });

      return new Response(JSON.stringify(evaluation), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (path === "/api/ai-chat" && request.method === "POST") {
      const body = await request.json();
      const { message, history, context } = body;
      if (!message) {
        return new Response(JSON.stringify({ error: "message is required" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const res = await aiChatWithGemini({ message, history, context });
      return new Response(
        JSON.stringify({
          reply: res.reply,
          provider: res.provider,
          modelUsed: res.modelUsed,
          attempts: res.attempts,
        }),
        {
          status: 200,
          headers: corsHeaders,
        },
      );
    }

    return new Response(JSON.stringify({ error: "API Route Not Found" }), {
      status: 404,
      headers: corsHeaders,
    });
  } catch (err) {
    console.warn("API handler error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal Server Error",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}
