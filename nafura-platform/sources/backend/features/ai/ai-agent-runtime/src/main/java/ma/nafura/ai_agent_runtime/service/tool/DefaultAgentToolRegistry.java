package ma.nafura.platform.ai.agent.service.tool;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class DefaultAgentToolRegistry implements AgentToolRegistry {
    private final Map<String, AgentTool> byKey;

    public DefaultAgentToolRegistry(List<AgentTool> tools) {
        this.byKey = tools.stream().collect(Collectors.toMap(AgentTool::key, Function.identity(), (a, b) -> a));
    }

    @Override
    public Optional<AgentTool> find(String key) {
        if (key == null || key.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(byKey.get(key.trim().toLowerCase()));
    }
}
