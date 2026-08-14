package ma.nafura.platform.ai.agent.model;

/**
 * Classified user intent for a single assistant turn.
 */
public enum IntentType {
    /** Read-only data query (counts, lists, KPIs). */
    READ,
    /** Navigation or help — resolve a route or explain where to go. */
    NAVIGATE,
    /** Write operation — propose actions requiring approval. */
    ACTION
}
