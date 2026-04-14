"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";
import { decrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

interface AIContentParams {
  model: string;
  contents: any;
  generationConfig?: {
    responseMimeType?: string;
    responseSchema?: any;
    systemInstruction?: string;
  };
}

export async function generateAIContentAction(params: AIContentParams) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized: Admin access required.");
    }

    // 2. Fetch & Decrypt Key
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("value")
      .eq("key", "GEMINI_API_KEY")
      .single();

    if (integrationError || !integration?.value) {
      throw new Error("Gemini API Key not found in integrations.");
    }

    const apiKey = decrypt(integration.value);

    // 3. Initialize SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 4. Configure Model
    const model = genAI.getGenerativeModel({ 
      model: params.model,
      systemInstruction: params.generationConfig?.systemInstruction
    });

    // 5. Generate Content
    const contents = await Promise.all((Array.isArray(params.contents) 
      ? (params.contents[0]?.parts ? params.contents : [{ role: 'user', parts: params.contents }])
      : [{ role: 'user', parts: [{ text: params.contents }] }]).map(async (content: any) => {
        const parts = await Promise.all(content.parts.map(async (part: any) => {
          if (part.image_url) {
            try {
              const res = await fetch(part.image_url);
              if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
              const buffer = await res.arrayBuffer();
              return {
                inlineData: {
                  data: Buffer.from(buffer).toString('base64'),
                  mimeType: res.headers.get('content-type') || 'image/jpeg'
                }
              };
            } catch (err: any) {
              console.warn(`[AI Utils] Failed to fetch image: ${part.image_url}`, err);
              return { text: `[Image Error: Could not fetch image from ${part.image_url}]` };
            }
          }
          return part;
        }));
        return { ...content, parts };
      }));

    const result = await model.generateContent({
      contents,
      generationConfig: {
        responseMimeType: params.generationConfig?.responseMimeType || "text/plain",
        responseSchema: params.generationConfig?.responseSchema
      }
    });

    const response = await result.response;
    return { text: response.text() };

  } catch (error: any) {
    console.error("[AI Action Error]:", error);
    return { error: error.message || "An unexpected error occurred during AI generation." };
  }
}
