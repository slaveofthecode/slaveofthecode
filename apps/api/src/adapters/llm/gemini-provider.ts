import type { GeminiConfig } from "../../config.js";
import type {
  GenerateOptions,
  LlmMessage,
  LlmProvider,
} from "../../domain/llm-provider.js";

interface GeminiCandidate {
  content?: { parts?: { text?: string }[] };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
}

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

/** Thrown when Gemini returns a non-2xx response. */
export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

function toGeminiContents(messages: LlmMessage[]): GeminiContent[] {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

/**
 * Google Gemini provider using the REST API through `fetch` (no SDK). Node and
 * Web compatible (ADR-0006).
 */
export class GeminiProvider implements LlmProvider {
  readonly name = "gemini";

  constructor(private readonly config: GeminiConfig) {}

  async generate(
    messages: LlmMessage[],
    options: GenerateOptions,
  ): Promise<string> {
    if (!this.config.apiKey) {
      throw new GeminiError("Missing GEMINI_API_KEY", 500);
    }

    const url = `${this.config.baseUrl}/models/${this.config.model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": this.config.apiKey,
      },
      signal: options.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: options.system }] },
        contents: toGeminiContents(messages),
        generationConfig: {
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxOutputTokens ?? 600,
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new GeminiError(
        `Gemini request failed (${response.status}): ${detail.slice(0, 200)}`,
        response.status,
      );
    }

    const data = (await response.json()) as GeminiResponse;

    if (data.promptFeedback?.blockReason) {
      throw new GeminiError(
        `Gemini blocked the prompt: ${data.promptFeedback.blockReason}`,
        400,
      );
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new GeminiError("Gemini returned an empty response", 502);
    }

    return text;
  }
}
