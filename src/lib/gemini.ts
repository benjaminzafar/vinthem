import { createClient } from '@/utils/supabase/client';

export function getAI() {
  const supabase = createClient();
  
  return {
    models: {
      generateContent: async (params: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            prompt: params.contents,
            systemInstruction: params.config?.systemInstruction,
            responseMimeType: params.config?.responseMimeType,
            responseSchema: params.config?.responseSchema
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate content');
        }
        
        const data = await response.json();
        return { text: data.text };
      }
    }
  };
}
