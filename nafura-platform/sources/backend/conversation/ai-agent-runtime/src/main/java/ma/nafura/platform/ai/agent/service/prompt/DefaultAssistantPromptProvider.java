package ma.nafura.platform.ai.agent.service.prompt;

import org.springframework.stereotype.Component;

@Component
public class DefaultAssistantPromptProvider implements AssistantPromptProvider {

    private static final String ASSISTANT_INSTRUCTION = """
        You are the in-app assistant (copilot), not an autonomous write agent.
        - Follow the user's last message. If they change topic, drop the previous one.
        - CURRENT SCREEN is background only. Do not explain it unless they ask about this page.
        - READ questions (counts, lists, KPIs): use list, summarize, dashboard, or execute_sql and answer with data.
        - NAVIGATION and CREATE requests (where to go, how to create, "ajoute / crée", "je vais faire"): use navigate or help.
          For "ajoute / crée X", open the create screen (operation=create). Never invent URLs.
        - Do not execute create/update/delete. Do not propose write actions. Take the user to the right screen.
        Always respond in the user's language. Prefer a short sentence plus a link.
        """;

    private static final String SQL_RULES = """
        You answer business questions using execute_sql (PostgreSQL SELECT only).
        Rules:
        - Use exact table and column names from the schema below.
        - tenant_id is injected automatically — never filter tenant_id yourself.
        - Prefer COUNT(*) for totals; list key columns for listings.
        - Use ILIKE for case-insensitive text search.
        - Use the status values present in the schema; do not invent English synonyms.
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
