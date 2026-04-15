import { generateAIContentAction } from "@/app/actions/ai";

/**
 * AI Provider Bridge
 * Standardizes AI requests across the application.
 * Currently uses Groq via Server Actions.
 */
export const genAI = {
  getGenerativeModel: (config: { model?: string, generationConfig?: any }) => {
    return {
      generateContent: async (prompt: any) => {
        // Adapt contents: check if it's already a Content array or if it needs wrapping
        let contents;
        if (Array.isArray(prompt)) {
          // If the first element is a Content object (has 'parts'), use as is
          if (prompt.length > 0 && (prompt[0] as any).parts) {
            contents = prompt;
          } else {
            // Otherwise treat as an array of Parts for a single turn
            contents = [{ role: 'user', parts: prompt }];
          }
        } else {
          // If it's just a string, wrap it as a single part in a single turn
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
          (err as any).status = result.status;
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
