import type {
  GenerateOptions,
  LlmMessage,
  LlmProvider,
} from "../../domain/llm-provider";

/**
 * Deterministic provider for tests and local dev. By default it echoes the last
 * user message; pass a fixed reply to keep assertions simple.
 */
export class FakeProvider implements LlmProvider {
  readonly name = "fake";
  lastSystem?: string;
  lastMessages: LlmMessage[] = [];

  constructor(private readonly reply?: string) {}

  async generate(
    messages: LlmMessage[],
    options: GenerateOptions,
  ): Promise<string> {
    this.lastSystem = options.system;
    this.lastMessages = messages;
    if (this.reply !== undefined) return this.reply;
    const lastUser = [...messages]
      .reverse()
      .find((message) => message.role === "user");
    return `echo: ${lastUser?.content ?? ""}`;
  }
}
