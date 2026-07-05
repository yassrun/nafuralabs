package ma.nafura.platform.ai.agent.service.prompt;

/**
 * Product-provided system instructions and SQL/assistant rules.
 */
public interface AssistantPromptProvider {

    /** System instruction for unified assistant turns. */
    default String assistantSystemInstruction() {
        return null;
    }

    /** Additional rules appended when READ pipeline uses SQL. */
    default String sqlReadRules() {
        return null;
    }

    /** System instruction for ACTION proposal planning. */
    default String actionPlannerInstruction() {
        return null;
    }
}
