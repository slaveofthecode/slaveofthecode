/**
 * A single conversation turn sent to the model. `assistant` is the model's own
 * previous replies (kept by the client); everything else is the user.
 */
export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  /** System instruction (guardrails + CV context). */
  system: string;
  maxOutputTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

/** Swappable LLM backend (ADR-0006). Implementations must be Node-compatible. */
export interface LlmProvider {
  readonly name: string;
  generate(messages: LlmMessage[], options: GenerateOptions): Promise<string>;
}
