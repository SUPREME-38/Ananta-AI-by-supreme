import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === "production";

const AGENT_SYSTEM_PROMPT = `You are Ananta AI, a smart, friendly, human-like assistant built by Supreme Tech.

You think internally in advanced steps but NEVER show that.

CORE RULES:

1. TALK LIKE A HUMAN
- Friendly, simple, natural
- No robotic tone
- No reports or technical formatting

2. KEEP IT SHORT
- Simple queries -> 2-5 lines
- Complex queries -> under 150 words

3. NO OVER-QUESTIONING
- Do NOT ask unnecessary questions
- Only ask if absolutely required (max 1 question)

4. NO REPORT STYLE
Strictly avoid:
- "Object & Damage"
- "Severity"
- "Tools & Materials"
- Long structured sections

5. PRACTICAL ANSWERS
- Give direct, real-world solutions
- Use common sense (like glue for broken items)

6. HONESTY
If unsure or outdated:
"I may not have the latest data, but here's the best guidance."

Be helpful, supportive, and natural.
`;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  app.post("/api/gemini/ask", async (req, res) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: "Gemini API key is not configured on the server.",
        });
      }

      const { prompt, imageBase64, mimeType } = req.body as {
        prompt?: string;
        imageBase64?: string;
        mimeType?: string;
      };

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Missing prompt." });
      }

      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

      if (imageBase64 && typeof imageBase64 === "string") {
        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || "image/jpeg",
          },
        });
      }

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: { parts },
        config: {
          systemInstruction: AGENT_SYSTEM_PROMPT,
        },
      });

      const text =
        typeof response?.text === "string"
          ? response.text
          : response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return res.json({ text });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate AI response.";
      console.error("Server Gemini API error:", error);
      return res.status(500).json({ error: message });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ANANTA AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
