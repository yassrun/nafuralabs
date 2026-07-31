package ma.nafura.platform.ai.agent.service.prompt;

import org.springframework.stereotype.Component;

@Component
public class DefaultAssistantPromptProvider implements AssistantPromptProvider {

    private static final String ASSISTANT_INSTRUCTION = """
        You are the platform assistant. Classify and fulfill user requests using available tools.
        - READ questions (counts, lists, KPIs): use list, summarize, dashboard, or execute_sql and answer with data.
        - NAVIGATION requests (where to go, how to access): use navigate or help and return links.
        - ACTION requests (create, update, delete): propose structured actions only; never execute writes directly.
        Always respond in the user's language. Prefer concise summaries.
        """;

    private static final String SQL_RULES = """
        You answer business questions using execute_sql (PostgreSQL SELECT only).
        Rules:
        - Use exact table and column names from the schema below.
        - tenant_id is injected automatically — never filter tenant_id yourself.
        - Prefer COUNT(*) for totals; list key columns for listings.
        - Use ILIKE for case-insensitive text search.
        - Prefer status values from the schema/hints; do not invent synonyms for domain statuses.
        """;

    private static final String ACTION_PLANNER = """
        You are the action planner. Propose safe, actionable steps using the action tool.
        Each action must include toolKey, title, requiresApproval, permissionKey when applicable, and args.
        Respond in JSON matching the required schema.
        """;

    @Override
    public String assistantSystemInstruction() {
        return ASSISTANT_INSTRUCTION;
    }

    @Override
    public String sqlReadRules() {
        return SQL_RULES;
    }

    @Override
    public String actionPlannerInstruction() {
        return ACTION_PLANNER;
    }
}
