"use server";

import OpenAI from "openai";
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
      throw new Error("Groq API Key not found in integrations. Please set it in the Integrations Manager.");
    }

    const apiKey = decrypt(groqKey);

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
    const hasImages = Array.isArray(params.contents) && params.contents.some((c: any) => 
      c.parts?.some((p: any) => p.image_url || p.inlineData)
    );
    if (hasImages && !activeModel.includes('vision')) {
      activeModel = "llama-3.2-11b-vision-preview";
    }

    // 5. Convert Gemini Contents structure to OpenAI Messages structure
    const messages: any[] = [];
    
    // Add system instruction if provided
    if (params.generationConfig?.systemInstruction) {
      messages.push({ role: "system", content: params.generationConfig.systemInstruction });
    }

    for (const content of params.contents) {
      const role = content.role === 'model' ? 'assistant' : 'user';
      const parts = await Promise.all(content.parts.map(async (part: any) => {
        if (part.text) {
          return { type: "text", text: part.text };
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
              return { type: "text", text: "[Image Error]" };
            }
          } else {
            dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
          return { type: "image_url", image_url: { url: dataUrl } };
        }
        return null;
      }));
      
      const filteredParts = parts.filter(p => p !== null);
      messages.push({ 
        role, 
        content: filteredParts.length === 1 && filteredParts[0].type === 'text' 
          ? filteredParts[0].text 
          : filteredParts 
      });
    }

    const completion = await client.chat.completions.create({
      model: activeModel,
      messages: messages,
      response_format: params.generationConfig?.responseMimeType === "application/json" 
        ? { type: "json_object" } 
        : undefined,
      temperature: 0.7,
    });

    return { text: completion?.choices[0]?.message?.content || "" };

  } catch (error: any) {
    console.error("[Groq Action Error]:", error);
    
    const now = new Date().toLocaleTimeString();
    const status = error.status || 500;

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
      error: error.message || "An unexpected error occurred during Groq AI generation.",
      status: status
    };
  }
}
