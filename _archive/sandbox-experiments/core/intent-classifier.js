/**
 * Intent Classifier (Sandbox)
 * - Heuristic-based
 * - No AI calls
 * - No enforcement
 */

export function classifyIntent(content = "") {
    const text = content.toLowerCase();
  
    if (
      text.includes("help") ||
      text.includes("crisis") ||
      text.includes("emergency")
    ) {
      return "crisis-support";
    }
  
    if (
      text.includes("how to") ||
      text.includes("steps") ||
      text.includes("guide")
    ) {
      return "guidance";
    }
  
    if (
      text.includes("why") ||
      text.includes("meaning") ||
      text.includes("understand")
    ) {
      return "reflection";
    }
  
    return "general-support";
  }
  