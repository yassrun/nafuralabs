package ma.nafura.platform.ai.agent.service.tool;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import ma.nafura.platform.ai.agent.model.AssistantLink;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.ai.agent.service.navigation.HelpEntry;
import ma.nafura.platform.ai.agent.service.navigation.HelpResolver;
import org.springframework.stereotype.Component;

@Component
public class HelpAgentTool implements AgentTool {

    private final HelpResolver helpResolver;

    public HelpAgentTool(HelpResolver helpResolver) {
        this.helpResolver = helpResolver;
    }

    @Override
    public String key() {
        return "help";
    }

    @Override
    public AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context) {
        Map<String, Object> args = request.getArguments() != null ? request.getArguments() : Map.of();
        String question = asString(args.get("question"));
        if (question == null) {
            question = "";
        }

        HelpEntry match = helpResolver.match(question)
                .orElseGet(() -> HelpEntry.builder()
                        .keywords(List.of("default"))
                        .answer("I'm not sure about that. Try rephrasing or ask your administrator.")
                        .links(List.of(AssistantLink.builder().label("Open Dashboard").route("/dashboard").build()))
                        .build());

        List<Map<String, String>> linkMaps = new ArrayList<>();
        if (match.getLinks() != null) {
            for (AssistantLink link : match.getLinks()) {
                Map<String, String> map = new HashMap<>();
                map.put("label", link.getLabel());
                map.put("route", link.getRoute());
                if (link.getIcon() != null) {
                    map.put("icon", link.getIcon());
                }
                linkMaps.add(map);
            }
        }

        return AgentToolResult.builder()
                .success(true)
                .message("Help response generated")
                .payload(Map.of(
                        "question", question,
                        "answer", match.getAnswer(),
                        "links", linkMaps
                ))
                .build();
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }
}
