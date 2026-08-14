package ma.nafura.platform.ai.llm.model;

/**
 * Conversation inference mode.
 * {@link #ASSISTANT} is the unified mode; {@link #ASK} and {@link #AGENT} are legacy.
 */
public enum LlmMode {
    /** Unified assistant: intent router handles READ, NAVIGATE, and ACTION internally. */
    ASSISTANT,
    /** @deprecated Use {@link #ASSISTANT}. Legacy read-only Q&amp;A mode. */
    @Deprecated
    ASK,
    /** @deprecated Use {@link #ASSISTANT}. Legacy action proposal mode. */
    @Deprecated
    AGENT
}
