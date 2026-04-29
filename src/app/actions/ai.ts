"use server";

import OpenAI from "openai";
import { decrypt } from "@/lib/encryption";
import { requireAdminUser } from "@/lib/admin";
import { buildSystemInstruction, getDefaultPromptValue, getPromptKeyForProfile, type AIPromptProfile } from "@/lib/ai-prompts";
import { logger } from "@/lib/logger";

interface AIContentParams {
  model: string;
  promptProfile?: AIPromptProfile;
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

function isTransientGroqStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 503;
}

function getErrorStatus(error: unknown): number | null {
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : null;
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateAIContentAction(params: AIContentParams) {
  const now = new Date().toLocaleTimeString();
  let activeModel = "llama-3.3-70b-versatile"; // Default Groq fallback

  try {
    const { supabase } = await requireAdminUser();
    const profilePromptKey = getPromptKeyForProfile(params.promptProfile);
    const integrationKeys = ["GROQ_API_KEY", "GROQ_MODEL", "AI_DEFAULT_PROMPT"];
    if (profilePromptKey) {
      integrationKeys.push(profilePromptKey);
    }

    const { data: integrations, error: integrationError } = await supabase
      .from("integrations")
      .select("key, value")
      .in("key", integrationKeys);

    if (integrationError) throw integrationError;
    
    const integrationsMap = Object.fromEntries(integrations?.map(i => [i.key, i.value]) || []);
    const groqKey = integrationsMap["GROQ_API_KEY"];
    const groqModel = integrationsMap["GROQ_MODEL"] || "llama-3.3-70b-versatile";

    if (!groqKey) {
      logger.warn(`[Groq Action] [${now}] GROQ_API_KEY is missing from 'integrations' table.`);
      throw new Error("Groq API Key not found in integrations. Please set it in the Integrations Manager.");
    }

    let apiKey = "";
    try {
      apiKey = await decrypt(groqKey);
    } catch (decryptErr: unknown) {
      logger.error(`[Groq Action] [${now}] FAILED TO DECRYPT GROQ_API_KEY. The ENCRYPTION_SECRET might be invalid or have changed.`, decryptErr);
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

    const systemInstruction = buildSystemInstruction([
      integrationsMap["AI_DEFAULT_PROMPT"] || getDefaultPromptValue("AI_DEFAULT_PROMPT"),
      profilePromptKey ? integrationsMap[profilePromptKey] || getDefaultPromptValue(profilePromptKey) : undefined,
      params.generationConfig?.systemInstruction,
    ]);

    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
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
            } catch (err: unknown) {
              logger.warn("[GROQ] Failed to fetch image:", part.image_url, err);
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
      const userContent: OpenAI.Chat.ChatCompletionUserMessageParam['content'] =
        filteredParts.length === 1 && filteredParts[0].type === 'text'
          ? filteredParts[0].text
          : filteredParts.map((part) =>
              part.type === 'text'
                ? { type: 'text', text: part.text }
                : { type: 'image_url', image_url: part.image_url }
            );

      if (role === 'assistant') {
        const assistantContent: OpenAI.Chat.ChatCompletionAssistantMessageParam['content'] =
          typeof userContent === 'string'
            ? userContent
            : userContent.map((part) =>
                part.type === 'text'
                  ? part
                  : { type: 'text', text: '[Image omitted from assistant history]' }
              );

        messages.push({
          role: 'assistant',
          content: assistantContent,
        });
      } else {
        messages.push({
          role: 'user',
          content: userContent,
        });
      }
    }

    let completion: OpenAI.Chat.Completions.ChatCompletion | null = null;
    let lastCompletionError: unknown = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        completion = await client.chat.completions.create({
          model: activeModel,
          messages: messages,
          response_format: params.generationConfig?.responseMimeType === "application/json"
            ? { type: "json_object" }
            : undefined,
          temperature: params.generationConfig?.temperature !== undefined
            ? Number(params.generationConfig.temperature)
            : 0.7,
        });
        break;
      } catch (error: unknown) {
        lastCompletionError = error;
        const status = getErrorStatus(error);
        if (attempt === 0 && status !== null && isTransientGroqStatus(status)) {
          logger.warn(`[Groq Action] transient failure on attempt ${attempt + 1}, retrying once.`, error);
          await sleep(900);
          continue;
        }
        throw error;
      }
    }

    if (!completion) {
      throw lastCompletionError instanceof Error
        ? lastCompletionError
        : new Error("Groq did not return a completion.");
    }

    return { text: completion?.choices[0]?.message?.content || "" };

  } catch (error: unknown) {
    const now = new Date().toLocaleTimeString();
    const err = error instanceof Error ? error : new Error("An unexpected error occurred during Groq AI generation.");
    const status =
      typeof error === 'object' && error && 'status' in error && typeof (error as { status?: unknown }).status === 'number'
        ? ((error as { status?: number }).status ?? 500)
        : 500;

    if (isTransientGroqStatus(status)) {
      logger.warn("[Groq Action Temporary Error]:", error);
    } else {
      logger.error("[Groq Action Error]:", error);
    }

    if (status === 401 || status === 403) {
      return { 
        error: "Invalid or missing Groq API Key. Please check your integrations settings.",
        status: status
      };
    }

    if (status === 429) {
      return { 
        error: `[${now}] AI is temporarily busy. Please wait a few seconds and try again.`,
        status: status
      };
    }

    if (status === 503 || status === 500) {
      return {
        error: `[${now}] AI translation is temporarily unavailable because the provider is overloaded. Please try again in 1-2 minutes.`,
        status: status
      };
    }

    return { 
      error: err.message || "An unexpected error occurred during Groq AI generation.",
      status: status
    };
  }
}
