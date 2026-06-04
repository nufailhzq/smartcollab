"use server";

import { auth } from "@/lib/auth";

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AskAiResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `Anda ialah FolioBot AI, pembantu pintar dalam sistem UKMFolio (SMARTCOLLAB) — LMS untuk Fakulti Sains Maklumat dan Teknologi (FTSM), Universiti Kebangsaan Malaysia.

Anda membantu PELAJAR dengan:
- Memahami konsep dalam kursus FTSM (pengaturcaraan, struktur data, pangkalan data, kejuruteraan perisian, AI, rangkaian, dsb.)
- Tips belajar, tatacara hantar tugasan, cara guna sistem UKMFolio
- Soalan teknikal pengaturcaraan (Java, JavaScript, Python, C/C++, PHP, SQL, dll.)
- Sumber rujukan akademik dan tips kerjaya IT

Garis panduan:
- Jawab dalam Bahasa Melayu secara lalai. Jika pengguna menulis dalam Bahasa Inggeris, balas dalam Bahasa Inggeris.
- Mesra, ringkas, dan jelas. Guna bullet/numbering bila perlu.
- Jangan buat tugasan untuk pelajar — bantu mereka FAHAM, jangan beri jawapan terus untuk soalan tugasan. Galakkan pembelajaran sendiri.
- Jika soalan di luar skop akademik FTSM (e.g. nasihat perubatan, kewangan), tolak dengan sopan dan cadangkan rujukan rasmi.
- Jangan reka maklumat tentang kursus, jadual, atau pensyarah tertentu — minta pelajar semak di UKMFolio jika perlu.`;

export async function askAi(history: AiChatMessage[]): Promise<AskAiResult> {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Sesi tamat. Sila log masuk semula." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "AI belum dikonfigurasi. Hubungi admin (GEMINI_API_KEY hilang).",
    };
  }

  if (history.length === 0) {
    return { ok: false, error: "Tiada mesej." };
  }

  const last = history[history.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return { ok: false, error: "Mesej tidak sah." };
  }

  // Gemini REST format
  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Gemini API error:", res.status, body);
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: "Kunci API Gemini tidak sah. Hubungi admin." };
      }
      if (res.status === 429) {
        return { ok: false, error: "AI sibuk. Sila cuba lagi sekejap." };
      }
      return { ok: false, error: "AI tidak dapat membalas. Sila cuba lagi." };
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
      promptFeedback?: { blockReason?: string };
    };

    if (data.promptFeedback?.blockReason) {
      return {
        ok: false,
        error: "Mesej anda dihalang oleh penapis keselamatan. Cuba soalan lain.",
      };
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!reply) {
      return { ok: false, error: "AI tidak memberi balasan. Sila cuba lagi." };
    }

    return { ok: true, reply };
  } catch (err) {
    console.error("askAi failed:", err);
    return { ok: false, error: "Sambungan AI gagal. Semak rangkaian anda." };
  }
}
