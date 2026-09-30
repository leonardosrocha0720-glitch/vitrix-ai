import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

export type GenerationProvider = "claude" | "gemini";

interface ProviderConfig {
  apiKeyEnv: string;
  generate: (prompt: string, apiKey: string) => Promise<string>;
}

const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

async function generateWithClaude(prompt: string, apiKey: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });
  return (message.content[0] as { type: string; text: string }).text;
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    contents: prompt,
    // Folga maior que a do Claude: no Gemini o raciocínio interno também
    // consome esse limite, e o HTML não pode sair cortado.
    config: { maxOutputTokens: 32768 },
  });
  const text = response.text;
  if (!text) {
    const reason = response.candidates?.[0]?.finishReason ?? "sem resposta";
    throw new Error(`Gemini não retornou HTML (${reason}).`);
  }
  return text;
}

const PROVIDERS: Record<GenerationProvider, ProviderConfig> = {
  claude: { apiKeyEnv: "ANTHROPIC_API_KEY", generate: generateWithClaude },
  gemini: { apiKeyEnv: "GOOGLE_API_KEY", generate: generateWithGemini },
};

// GENERATION_MODEL no .env escolhe o provedor; qualquer outro valor cai no Claude
export function getGenerationProvider(): GenerationProvider {
  return process.env.GENERATION_MODEL?.trim().toLowerCase() === "gemini" ? "gemini" : "claude";
}

export function getProviderApiKey(provider: GenerationProvider): { env: string; key?: string } {
  const env = PROVIDERS[provider].apiKeyEnv;
  return { env, key: process.env[env] };
}

export async function generateSiteHtml(
  provider: GenerationProvider,
  prompt: string,
  apiKey: string,
): Promise<string> {
  const html = await PROVIDERS[provider].generate(prompt, apiKey);
  // Remove markdown code blocks caso o modelo os inclua
  return html.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/i, "").trim();
}
