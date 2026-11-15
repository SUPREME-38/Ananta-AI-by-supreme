import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 🎨 Tailwind Merger
 * Combines standard Tailwind classes cleanly without conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ✂️ Input Truncation (Enterprise Shield)
 * Prevents users from crashing Gemini or draining tokens with massive text pastes.
 */
export const truncatePrompt = (text: string, limit: number = 2000): string => {
  if (text.length <= limit) return text;
  
  // Cut the text at the limit and add an indicator
  return text.substring(0, limit) + "... [Truncated for Token Limits]";
};