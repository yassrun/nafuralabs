package ma.nafura.platform.ai.agent.service.intent;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import ma.nafura.platform.ai.agent.model.IntentType;
import ma.nafura.platform.ai.agent.service.tool.AgentToolDescriptions;
import ma.nafura.platform.ai.llm.model.ToolDefinition;
import org.springframework.stereotype.Component;

@Component
public class IntentToolSelector {

    private static final Set<String> READ_TOOLS = Set.of(
            "execute_sql", "list", "summarize", "dashboard", "search"
    );

    private static final Set<String> NAVIGATE_TOOLS = Set.of(
            "navigate", "help", "search"
    );

    private static final Set<String> ACTION_TOOLS = Set.of(
            "action"
    );

    private final AgentToolDescriptions agentToolDescriptions;

    public IntentToolSelector(AgentToolDescriptions agentToolDescriptions) {
        this.agentToolDescriptions = agentToolDescriptions;
    }

    public List<ToolDefinition> toolsFor(IntentType intent) {
        Set<String> allowed = switch (intent) {
            case READ -> READ_TOOLS;
            case NAVIGATE -> NAVIGATE_TOOLS;
            case ACTION -> ACTION_TOOLS;
        };
        return agentToolDescriptions.all().stream()
                .filter(tool -> allowed.contains(tool.getName()))
                .toList();
    }

    public Set<IntentType> supportedIntents() {
        return EnumSet.allOf(IntentType.class);
    }
}
