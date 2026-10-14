# ADR-0004 Context stuffing instead of RAG for the chat

- **Context:** recruiters will ask questions answered only from the CV. The whole CV
  is only a few thousand tokens.
- **Decision:** stuff the entire CV into the system prompt (context stuffing), no
  vector DB. The LLM is behind an `LLMProvider` interface with free-tier
  implementations.
- **Consequences:** simple, no infra, answers are grounded and auditable. Cost: the
  provider's context window bounds growth; revisit only if the corpus grows a lot.
