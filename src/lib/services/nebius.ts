export interface NebiusChatOptions {
  model?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export class NebiusService {
  private baseUrl: string;
  private apiKey: string;
  public defaultNanoModel: string;
  public defaultSuperModel: string;

  constructor() {
    this.baseUrl = (process.env.NEBIUS_BASE_URL || "https://api.tokenfactory.nebius.com/v1/").replace(/\/+$/, "");
    this.apiKey = process.env.NEBIUS_API_KEY || "";
    this.defaultNanoModel = process.env.NEBIUS_MODEL_NANO || "nvidia/nemotron-3-nano-30b-a3b";
    this.defaultSuperModel = process.env.NEBIUS_MODEL_SUPER || "nvidia/nemotron-3-super-120b-a12b";
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getEffectiveModel(type: "nano" | "super" = "super"): string {
    return type === "nano" ? this.defaultNanoModel : this.defaultSuperModel;
  }

  /**
   * Tests real connectivity and authorization with the Nebius Token Factory API.
   * Never fabricates results.
   */
  public async verifyCredentials(): Promise<{ valid: boolean; message: string; availableModels?: string[] }> {
    if (!this.isConfigured()) {
      return {
        valid: false,
        message: "NEBIUS_API_KEY is not configured in the environment. Please add it to .env.local.",
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        return {
          valid: false,
          message: "Unauthorized: Invalid Nebius API key or access denied by Nebius Token Factory.",
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          valid: false,
          message: `Nebius API returned error status ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      const models: string[] = Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [];

      return {
        valid: true,
        message: `Successfully authenticated with Nebius Token Factory. ${models.length} models accessible.`,
        availableModels: models,
      };
    } catch (err: any) {
      return {
        valid: false,
        message: `Failed to connect to Nebius Token Factory endpoint (${this.baseUrl}): ${err?.message || String(err)}`,
      };
    }
  }

  /**
   * Executes inference through Nebius Token Factory using an NVIDIA Nemotron open model.
   * Absolutely NO fallback to Gemini, Ollama, OpenAI, or Anthropic.
   */
  public async chatCompletion(options: NebiusChatOptions): Promise<{ content: string; model: string }> {
    if (!this.isConfigured()) {
      throw new Error(
        "Nebius inference failed: NEBIUS_API_KEY is not configured on the server. Please check your .env.local configuration."
      );
    }

    const selectedModel = options.model || this.defaultSuperModel;

    const requestBody: Record<string, any> = {
      model: selectedModel,
      messages: options.messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 3500,
    };

    if (options.jsonMode) {
      requestBody.response_format = { type: "json_object" };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for complex Nemotron Super synthesis

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        let parsedMessage = errorBody;
        try {
          const jsonErr = JSON.parse(errorBody);
          if (jsonErr.error?.message) {
            parsedMessage = jsonErr.error.message;
          }
        } catch {}

        throw new Error(
          `Nebius Token Factory inference error with NVIDIA model [${selectedModel}] (HTTP ${response.status}): ${parsedMessage}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      return {
        content,
        model: selectedModel,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error(`Nebius inference with [${selectedModel}] timed out after 60 seconds.`);
      }
      throw err;
    }
  }

  /**
   * Parses structured JSON from Nemotron output, safely stripping markdown code blocks.
   */
  public parseJsonOutput<T = any>(rawText: string): T {
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
      return JSON.parse(cleaned);
    } catch (e: any) {
      // Try to find first '{' and last '}'
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const sliced = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(sliced);
      }
      throw new Error(`Failed to parse structured JSON from Nemotron response: ${e.message}. Raw output snippet: ${rawText.slice(0, 200)}`);
    }
  }
}

export const nebiusService = new NebiusService();
