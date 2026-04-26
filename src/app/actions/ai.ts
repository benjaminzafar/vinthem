"use server";

import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";
import { decrypt } from "@/lib/encryption";

interface AIContentParams {
  model: string;
  contents: Array<{
    role: string;
    parts: Array<{
      text?: string;
      image_url?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
  }>;
  generationConfig?: {
    responseMimeType?: string;
    responseSchema?: Record<string, unknown>;
    systemInstruction?: string;
    temperature?: number;
  };
  nonce?: string; // Cache-busting nonce
}

export async function generateAIContentAction(params: AIContentParams) {
  const now = new Date().toLocaleTimeString();
  let activeModel = "llama-3.3-70b-versatile"; // Default Groq fallback

  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized: Admin access required.");
    }

    // 2. Fetch & Decrypt Key & Model (Switching to GROQ namespace)
    const { data: integrations, error: integrationError } = await supabase
      .from("integrations")
      .select("key, value")
      .in("key", ["GROQ_API_KEY", "GROQ_MODEL"]);

    if (integrationError) throw integrationError;
    
    const integrationsMap = Object.fromEntries(integrations?.map(i => [i.key, i.value]) || []);
    const groqKey = integrationsMap["GROQ_API_KEY"];
    const groqModel = integrationsMap["GROQ_MODEL"] || "llama-3.3-70b-versatile";

    if (!groqKey) {
      console.warn(`[Groq Action] [${now}] GROQ_API_KEY is missing from 'integrations' table.`);
      throw new Error("Groq API Key not found in integrations. Please set it in the Integrations Manager.");
    }

    let apiKey = "";
    try {
      apiKey = await decrypt(groqKey);
    } catch (decryptErr) {
      console.error(`[Groq Action] [${now}] FAILED TO DECRYPT GROQ_API_KEY. The ENCRYPTION_SECRET might be invalid or have changed.`, decryptErr);
      throw new Error("Security Error: Failed to decrypt AI credentials. Please re-save your Groq API Key in the Integrations Manager.");
    }

    // 3. Initialize OpenAI Client (configured for Groq)
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    
    // 4. Configure Model (Auto-map old Gemini names if they come through)
    activeModel = params.model;
    if (!activeModel || activeModel.includes('gemini')) {
      activeModel = groqModel;
    }
    
    // Ensure we use a vision model if images are present
    const hasImages = params.contents.some(c => 
      c.parts?.some(p => p.image_url || p.inlineData)
    );
    if (hasImages && !activeModel.includes('vision')) {
      activeModel = "llama-3.2-11b-vision-preview";
    }

    // 5. Convert Gemini Contents structure to OpenAI Messages structure
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    // Add system instruction if provided
    if (params.generationConfig?.systemInstruction) {
      messages.push({ role: "system", content: params.generationConfig.systemInstruction });
    }

    for (const content of params.contents) {
      const role = content.role === 'model' ? 'assistant' : 'user';
      const parts = await Promise.all(content.parts.map(async (part) => {
        if (part.text) {
          return { type: "text" as const, text: part.text };
        }
        if (part.image_url || (part.inlineData && part.inlineData.data)) {
          let dataUrl = "";
          if (part.image_url) {
            try {
              const res = await fetch(part.image_url);
              const buffer = await res.arrayBuffer();
              const base64 = Buffer.from(buffer).toString('base64');
              const mime = res.headers.get('content-type') || 'image/jpeg';
              dataUrl = `data:${mime};base64,${base64}`;
            } catch (err) {
              console.warn("[GROQ] Failed to fetch image:", part.image_url);
              return { type: "text" as const, text: "[Image Error]" };
            }
          } else if (part.inlineData?.data) {
            dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
          
          if (dataUrl) {
            return { type: "image_url" as const, image_url: { url: dataUrl } };
          }
          return null;
        }
        return null;
      }));
      
      const filteredParts = parts.filter((p): p is NonNullable<typeof p> => p !== null);
      messages.push({ 
        role, 
        content: filteredParts.length === 1 && filteredParts[0].type === 'text' 
          ? filteredParts[0].text 
          : (filteredParts as any) 
      });
    }

    const completion = await client.chat.completions.create({
      model: activeModel,
      messages: messages,
      response_format: params.generationConfig?.responseMimeType === "application/json" 
        ? { type: "json_object" } 
        : undefined,
      temperature: params.generationConfig?.temperature !== undefined 
        ? Number(params.generationConfig.temperature) 
        : 0.7,
    });

    return { text: completion?.choices[0]?.message?.content || "" };

  } catch (error: unknown) {
    console.error("[Groq Action Error]:", error);
    
    const now = new Date().toLocaleTimeString();
    const err = error as { status?: number; message?: string };
    const status = err.status || 500;

    if (status === 401 || status === 403) {
      return { 
        error: "Invalid or missing Groq API Key. Please check your integrations settings.",
        status: status
      };
    }

    if (status === 429) {
      return { 
        error: `[${now}] GROQ RATE LIMIT (429). Groq is processing requests too fast for your current tier. Please wait a few seconds and try again.`,
        status: status
      };
    }

    if (status === 503 || status === 500) {
      return {
        error: `[${now}] GROQ SERVICE OVERLOAD (503/500). Groq's high-speed chips are currently at maximum capacity. Please wait 1-2 minutes.`,
        status: status
      };
    }

    return { 
      error: err.message || "An unexpected error occurred during Groq AI generation.",
      status: status
    };
  }
}
