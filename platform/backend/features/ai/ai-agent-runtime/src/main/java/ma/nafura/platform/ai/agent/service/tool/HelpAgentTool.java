package ma.nafura.platform.ai.agent.service.tool;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import org.springframework.stereotype.Component;

@Component
public class HelpAgentTool implements AgentTool {

    private final Map<String, HelpEntry> knowledgeBase;

    public HelpAgentTool() {
        this.knowledgeBase = buildKnowledgeBase();
    }

    @Override
    public String key() {
        return "help";
    }

    @Override
    public AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context) {
        // No permission check: help is available to all users (GAP 16-B)

        Map<String, Object> args = request.getArguments() != null ? request.getArguments() : Map.of();
        String question = asString(args.get("question"));
        if (question == null) {
            question = "";
        }
        String normalized = question.toLowerCase(Locale.ROOT);

        HelpEntry match = knowledgeBase.entrySet().stream()
                .filter(entry -> normalized.contains(entry.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElseGet(() -> knowledgeBase.get("default"));

        return AgentToolResult.builder()
                .success(true)
                .message("Help response generated")
                .payload(Map.of(
                        "question", question,
                        "answer", match.answer(),
                        "links", match.links()
                ))
                .build();
    }

    private Map<String, HelpEntry> buildKnowledgeBase() {
        Map<String, HelpEntry> map = new LinkedHashMap<>();
        map.put("workflow", new HelpEntry(
                "To configure workflows, go to Administration > Workflows. You can create approval steps and assign approvers.",
                List.of(
                        Map.of("label", "Workflow Admin", "route", "/administration/workflows")
                )
        ));
        map.put("invoice", new HelpEntry(
                "Invoices are managed under Finance > Invoices. You can create, edit, and track invoice status.",
                List.of(
                        Map.of("label", "Invoices", "route", "/finance/invoices")
                )
        ));
        map.put("settings", new HelpEntry(
                "App settings are in Administration > Settings. User settings are under your profile menu.",
                List.of(
                        Map.of("label", "App Settings", "route", "/administration/settings"),
                        Map.of("label", "User Settings", "route", "/user-settings")
                )
        ));
        map.put("webhook", new HelpEntry(
                "Use Administration > Webhooks to register callback URLs and monitor deliveries.",
                List.of(
                        Map.of("label", "Open Webhooks", "route", "/administration/webhooks")
                )
        ));
        map.put("api key", new HelpEntry(
                "API keys are managed in Administration > API Keys. Create once, copy the plain key immediately, then store it securely.",
                List.of(
                        Map.of("label", "Open API Keys", "route", "/administration/api-keys")
                )
        ));
        map.put("numbering", new HelpEntry(
                "Numbering sequences define prefixes, reset policy, and increments used to generate document numbers.",
                List.of(
                        Map.of("label", "Open Numbering Sequences", "route", "/administration/numbering-sequences")
                )
        ));
        map.put("notification", new HelpEntry(
                "Notifications can be reviewed from the bell dropdown or the full Notification Center page.",
                List.of(
                        Map.of("label", "Open Notifications", "route", "/notifications")
                )
        ));
        map.put("search", new HelpEntry(
                "Press Ctrl/Cmd+K to search pages and records. Recent items are shown first, then page and record matches.",
                List.of()
        ));
        map.put("approval", new HelpEntry(
                "Pending approvals are listed under Approvals. You can approve or reject requests from there.",
                List.of(
                        Map.of("label", "Approvals", "route", "/approvals")
                )
        ));
        map.put("member", new HelpEntry(
                "Team members are managed in Administration > Members. You can invite users and manage roles.",
                List.of(
                        Map.of("label", "Members", "route", "/administration/members")
                )
        ));
        map.put("partner", new HelpEntry(
                "Partners (customers and suppliers) are in Directory > Partners.",
                List.of(
                        Map.of("label", "Partners", "route", "/directory/partners")
                )
        ));
        map.put("dashboard", new HelpEntry(
                "The dashboard shows an overview of key metrics. Use the home link or Dashboard in the menu.",
                List.of(
                        Map.of("label", "Dashboard", "route", "/dashboard")
                )
        ));
        map.put("default", new HelpEntry(
                "I'm not sure about that. Try checking the documentation or asking your administrator.",
                List.of(
                        Map.of("label", "Open Dashboard", "route", "/dashboard")
                )
        ));
        return map;
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private record HelpEntry(String answer, List<Map<String, String>> links) {
    }
}
