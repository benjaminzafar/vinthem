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
  nonce?: string; // Cache-busting nonce
}

export async function generateAIContentAction(params: AIContentParams) {
  const now = new Date().toLocaleTimeString();
  let activeModel = "gemini-1.5-flash"; // Default fallback

  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized: Admin access required.");
    }

    // 2. Fetch & Decrypt Key & Model
    const { data: integrations, error: integrationError } = await supabase
      .from("integrations")
      .select("key, value")
      .in("key", ["GEMINI_API_KEY", "GEMINI_MODEL"]);

    if (integrationError) throw integrationError;
    
    const integrationsMap = Object.fromEntries(integrations?.map(i => [i.key, i.value]) || []);
    const geminiKey = integrationsMap["GEMINI_API_KEY"];
    const geminiModel = integrationsMap["GEMINI_MODEL"] || "gemini-1.5-flash";

    if (!geminiKey) {
      throw new Error("Gemini API Key not found in integrations.");
    }

    const apiKey = decrypt(geminiKey);

    // 3. Initialize SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 4. Configure Model
    activeModel = (params.model && (params.model.includes('2.5') || params.model.includes('3.1'))) 
      ? params.model 
      : geminiModel;
    
    const model = genAI.getGenerativeModel(
      { 
        model: activeModel,
        systemInstruction: params.generationConfig?.systemInstruction
      },
      { apiVersion: "v1beta" } // REQUIRED for v2.5 and newer preview features
    );

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

    // 5. Generate Content (With 1-time Retry & Self-Healing for 503)
    let result;
    try {
      result = await model.generateContent({
        contents,
        generationConfig: {
          responseMimeType: params.generationConfig?.responseMimeType || "text/plain",
          responseSchema: params.generationConfig?.responseSchema
        }
      });
    } catch (e: any) {
      const isRetryable = e.message?.includes('429') || e.status === 429 || e.message?.includes('503') || e.status === 503;
      if (isRetryable) {
        // SELF-HEALING (April 2026): If reasoning models fail, switch DB setting to the efficient 3.1 Flash-Lite
        if (activeModel.includes('pro')) {
            try {
                // We use the supabase client directly here for background update
                supabase.from('integrations').upsert({ 
                    key: 'GEMINI_MODEL', 
                    value: 'gemini-2.5-flash',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' }).then(({ error }) => {
                    if (error) console.error("[AI SERVICE] Self-healing DB update failed:", error);
                });
            } catch (dbErr) {
                console.error("[AI SERVICE] Self-healing DB update execution failed:", dbErr);
            }
        }

        let retries = 0;
        const maxRetries = 4;
        
        while (retries < maxRetries) {
            try {
                // DEEP BACKOFF (V4 Congestion Control - mid-2026)
                const delays = [3000, 8000, 15000, 25000];
                const baseWaitTime = delays[retries] || (retries * 5000);
                const jitter = Math.random() * 2000;
                const waitTime = baseWaitTime + jitter;
                
                console.warn(`[AI SERVICE CONGESTION] ${e.status || 'Error'} detected. Retry ${retries + 1}/${maxRetries} in ${Math.round(waitTime)}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                
                // FALLBACK MODEL SELECTION (April 2026 Resiliency)
                const retryModelName = activeModel; // Use current active model for retry
                
                const retryModel = genAI.getGenerativeModel(
                    { 
                        model: retryModelName,
                        systemInstruction: params.generationConfig?.systemInstruction
                    },
                    { apiVersion: 'v1beta' }
                );

                result = await retryModel.generateContent({
                  contents,
                  generationConfig: {
                    responseMimeType: params.generationConfig?.responseMimeType || "text/plain",
                    responseSchema: params.generationConfig?.responseSchema
                  }
                });
                
                break;
            } catch (retryErr: any) {
                retries++;
                const errorMessage = (retryErr.message || '').toUpperCase();
                const isStillRetryable = (errorMessage.includes('429') || retryErr.status === 429 || errorMessage.includes('503') || retryErr.status === 503);
                
                // V11 Logic: Stop retrying if we hit the DAILY limit (RPD). Retries only work for MINUTE limits (RPM).
                const isDailyLimit = errorMessage.includes('DAILY') || errorMessage.includes('RPD') || errorMessage.includes('DAILY_LIMIT');
                
                if (!isStillRetryable || isDailyLimit || retries >= maxRetries) throw retryErr;
            }
        }
      } else {
        throw e;
      }
    }

    const response = await result.response;
    return { text: response.text() };

  } catch (error: any) {
    console.error("[AI Action Error]:", error);
    
    // Explicit 429/503 Handling
    const now = new Date().toLocaleTimeString();
    console.error(`[AI Action Error ${now}]:`, error);
    
    // Explicit 429/503 Handling
    if (error.message?.includes('429') || error.status === 429) {
      const isDaily = error.message?.toUpperCase().includes('DAILY') || error.message?.toUpperCase().includes('RPD');
      return { 
        error: `[${now}] ${isDaily ? 'DAILY QUOTA EXHAUSTED' : 'RATE LIMIT HIT'} (429) for ${activeModel}. ${isDaily ? 'You have reached your 1,500 free daily requests. Reset happens at midnight UTC.' : 'You are sending requests too fast (RPM limit). Please wait 60 seconds and try again.'}` 
      };
    }

    if (error.message?.includes('503') || error.status === 503) {
      return {
        error: `[${now}] AI Service Congestion (503). All automatic self-healing retries failed because the global AI service is currently at maximum capacity. Please wait 5-10 minutes for regional demand to subside and try again.`
      };
    }
    
    if (error.message?.includes('429') || error.status === 429) {
      return {
        error: `[${now}] AI Quota Exceeded (429) for ${activeModel}. Your project has reached its current performance limit. I have switched your store to the most stable available model. Please check Google AI Studio for your Tier limits.`
      };
    }

    return { error: error.message || "An unexpected error occurred during AI generation." };
  }
}
