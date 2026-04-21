export function extractFirstJsonObject(input: string): string | null {
  const start = input.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < input.length; index += 1) {
    const char = input[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return input.slice(start, index + 1);
      }
    }
  }

  return null;
}

/**
 * Robustly parses a JSON response from an AI model.
 * Handles markdown code blocks, leading/trailing whitespace, and multiple objects.
 */
export function safeParseAiResponse<T = any>(input: string, fallback: T): T {
  if (!input) return fallback;

  let cleaned = input.trim();

  // 1. Remove markdown code blocks if present
  if (cleaned.includes('```')) {
    const blocks = cleaned.split('```');
    // Usually the second item is the content of the block
    // (e.g. [text, json, text])
    const middleBlock = blocks[1]?.replace(/^[a-z]+/, '').trim();
    if (middleBlock) cleaned = middleBlock;
  }

  // 2. Extract first valid JSON object structure
  const jsonStr = extractFirstJsonObject(cleaned);
  
  if (!jsonStr) {
    // If no object structure, it might be a raw JSON array or string
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      return fallback;
    }
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('[JSON] Parsing failed for AI response:', err);
    return fallback;
  }
}
