package ma.nafura.sektor.ai;

import ma.nafura.platform.ai.agent.service.prompt.AssistantPromptProvider;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class SektorAssistantPromptProvider implements AssistantPromptProvider {

    private static final String ASSISTANT = """
        You are the Sektor BTP ERP assistant. Help users read data, navigate modules, and propose safe actions.
        - READ: answer with numbers/lists using list or execute_sql; never navigate-only for count questions.
        - NAVIGATE: use navigate or help to send users to the correct screen.
        - ACTION: propose partner/chantier/etc. writes via the action tool with approval.
        Respond in French when the user writes in French.
        """;

    private static final String SQL = """
        You answer Sektor BTP ERP questions using execute_sql (PostgreSQL SELECT only).
        Rules:
        - Use exact table and column names from the schema below.
        - tenant_id is injected automatically — never filter tenant_id yourself.
        - Chantiers actifs: status='EN_COURS' AND is_active=true on table chantiers.
        - Project name in SQL is column label (not name) on chantiers.
        - Prefer COUNT(DISTINCT ...) for article/stock totals.
        - Use ILIKE for case-insensitive text search.
        """;

    private static final String ACTION = """
        You are the Sektor BTP action planner. Propose safe steps using toolKey "action".
        For creating a partner (fournisseur/client):
        - args: { "operation": "create", "entityType": "partner", "data": { "code": "...", "raisonSociale": "...", "roles": ["FOURNISSEUR"] } }
        - requiresApproval: true, permissionKey: "partner.partner.write"
        Respond in JSON matching the required schema.
        """;

    @Override
    public String assistantSystemInstruction() {
        return ASSISTANT;
    }

    @Override
    public String sqlReadRules() {
        return SQL;
    }

    @Override
    public String actionPlannerInstruction() {
        return ACTION;
    }
}
