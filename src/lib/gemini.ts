import { generateAIContentAction } from "@/app/actions/ai";

export const genAI = {
  getGenerativeModel: (config: { model: string, generationConfig?: any }) => {
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
          model: config.model,
          contents: contents,
          generationConfig: config.generationConfig
        });

        if (result.error) {
          throw new Error(result.error);
        }

        return {
          response: {
            text: () => result.text as string,
          },
          text: result.text as string
        };
      }
    };
  }
};

// Legacy support for getAI() if needed during migration
export function getAI() {
  return {
    models: genAI
  };
}
