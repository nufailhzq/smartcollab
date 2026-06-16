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

  // Latency-tuned defaults. gemini-2.0-flash is ~2-3× faster than 2.5-flash
  // for chat-length prompts. For 2.5-flash we also disable the thinking phase
  // (thinkingBudget: 0) which otherwise adds 1-2s of pre-response latency.
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const generationConfig: Record<string, unknown> = {
    temperature: 0.7,
    maxOutputTokens: 600,
    topP: 0.9,
  };
  if (model.startsWith("gemini-2.5")) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  try {
    // 12s upper bound — we'd rather show "AI sibuk" than hang the chat.
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 12_000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig,
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Gemini API error: ${res.status} (model=${model})`, body);
      if (res.status === 400) {
        // Usually a malformed request or an API-key-not-valid 400 from Google.
        const keyIssue = /api[_ ]?key/i.test(body);
        return {
          ok: false,
          error: keyIssue
            ? "Kunci API Gemini tidak sah. Hubungi admin."
            : "Permintaan AI tidak sah. Hubungi admin.",
        };
      }
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: "Kunci API Gemini tidak sah atau tiada kebenaran. Hubungi admin." };
      }
      if (res.status === 404) {
        // The model name doesn't exist / isn't available to this key.
        return {
          ok: false,
          error: `Model AI "${model}" tidak ditemui. Admin perlu semak tetapan GEMINI_MODEL.`,
        };
      }
      if (res.status === 429) {
        return { ok: false, error: "AI sibuk (had penggunaan dicapai). Sila cuba lagi sekejap." };
      }
      if (res.status >= 500) {
        return { ok: false, error: "Perkhidmatan AI Google sedang bermasalah. Cuba sebentar lagi." };
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

    const candidate = data.candidates?.[0];
    const reply = candidate?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!reply) {
      const finish = candidate?.finishReason;
      console.error("Gemini empty reply:", { finish, model });
      if (finish === "MAX_TOKENS") {
        // thinkingBudget burned the whole output budget before any text.
        return {
          ok: false,
          error: "Jawapan AI terpotong. Cuba soalan yang lebih ringkas.",
        };
      }
      if (finish === "SAFETY" || finish === "RECITATION") {
        return {
          ok: false,
          error: "Balasan AI dihalang oleh penapis keselamatan. Cuba soalan lain.",
        };
      }
      return { ok: false, error: "AI tidak memberi balasan. Sila cuba lagi." };
    }

    return { ok: true, reply };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        error: "AI mengambil masa terlalu lama. Sila cuba semula.",
      };
    }
    console.error("askAi failed:", err);
    return { ok: false, error: "Sambungan AI gagal. Semak rangkaian anda." };
  }
}
