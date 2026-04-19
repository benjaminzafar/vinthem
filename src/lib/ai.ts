import { generateAIContentAction } from "@/app/actions/ai";

/**
 * AI Provider Bridge
 * Standardizes AI requests across the application.
 * Currently uses Groq via Server Actions.
 */
type AIContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type AIContent = { role: 'user' | 'model'; parts: AIContentPart[] };

export const genAI = {
  getGenerativeModel: (config: { model?: string, generationConfig?: Record<string, unknown> }) => {
    return {
      generateContent: async (prompt: string | AIContentPart[] | AIContent[]) => {
        // Adapt contents: check if it's already a Content array or if it needs wrapping
        let contents: AIContent[];
        
        if (Array.isArray(prompt)) {
          if (prompt.length > 0 && 'parts' in prompt[0]) {
            contents = prompt as AIContent[];
          } else {
            contents = [{ role: 'user', parts: prompt as AIContentPart[] }];
          }
        } else {
          contents = [{ role: 'user', parts: [{ text: prompt }] }];
        }
        
        const result = await generateAIContentAction({
          model: config.model || "llama-3.3-70b-versatile",
          contents: contents,
          generationConfig: config.generationConfig,
          nonce: Date.now().toString()
        });

        if (result.error) {
          const err = new Error(result.error);
          // @ts-expect-error - Adding status to standard Error object
          err.status = result.status;
          throw err;
        }

        return {
          response: {
            text: () => result.text as string,
          },
          text: result.text as string,
          status: 200
        };
      }
    };
  }
};

// Compatibility export
export function getAI() {
  return {
    models: genAI
  };
}
