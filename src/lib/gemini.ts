import { supabase } from "@/integrations/supabase/client";

/**
 * 💎 ANANTA AI (v5.2 - HUMAN PERFECTED)
 * - Natural human responses
 * - No overthinking / no report style
 * - No unnecessary questions
 * - Stable + clean output
 */

// 🛡️ INPUT SANITIZATION
const scanAndSanitize = (input: string): string => {
  const lowerInput = input.toLowerCase();

  if (
    lowerInput.includes("ignore previous instructions") ||
    lowerInput.includes("system prompt")
  ) {
    throw new Error("Unsafe request blocked.");
  }

  return input;
};

// 🧠 CLEAN RESPONSE FORMATTER
const cleanResponse = (text: string): string => {
  let cleaned = text;

  // ❌ Remove report-style junk
  cleaned = cleaned
    .replace(/object.*?:/gi, "")
    .replace(/severity.*?:/gi, "")
    .replace(/tools.*?:/gi, "")
    .replace(/materials.*?:/gi, "")
    .replace(/\*\*/g, "") // remove bold stars
    .replace(/#+/g, "")   // remove markdown headers
    .trim();

  // ❌ Remove unnecessary follow-up questioning
  if (cleaned.toLowerCase().includes("let me know") && cleaned.length < 200) {
    cleaned = cleaned.replace(/let me know.*$/gi, "");
  }

  // ✂️ Limit size
  if (cleaned.length > 600) {
    cleaned = cleaned.substring(0, 550) + "...";
  }

  return cleaned.trim();
};

// 🧠 MAIN FUNCTION
export const askAnanta = async (
  prompt: string,
  imageBase64?: string
): Promise<string> => {
  let user: { id: string } | null = null;

  try {
    // ✅ Safe user fetch
    try {
      const res = await supabase.auth.getUser();
      user = res?.data?.user || null;
    } catch {
      // Ignore auth lookup errors
    }

    const cleanPrompt = scanAndSanitize(prompt);

    const res = await fetch("/api/gemini/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: cleanPrompt,
        imageBase64,
        mimeType: "image/jpeg",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return data?.error || "AI is a bit busy right now. Try again 👍";
    }

    let text = typeof data?.text === "string" ? data.text : "";

    // 🛡️ fallback
    if (!text || text.length < 2) {
      text = "Something went wrong. Try again.";
    }

    // ✅ FINAL CLEANING
    text = cleanResponse(text);

    // 🧾 Logging (safe)
    if (user) {
      try {
        await supabase.from("agent_logs" as "chat_history").insert({
          user_id: user.id,
          module_name: "ananta_core",
          prompt_summary: cleanPrompt.substring(0, 100),
          status: "Success",
        } as never);
      } catch {
        // Ignore logging errors
      }
    }

    return text;
  } catch (error: unknown) {
    console.error("🔥 ERROR:", error);

    return "AI is a bit busy right now. Try again 👍";
  }
};