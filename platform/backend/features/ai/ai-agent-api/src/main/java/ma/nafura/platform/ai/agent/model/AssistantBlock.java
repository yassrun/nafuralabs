package ma.nafura.platform.ai.agent.model;

import java.util.Map;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AssistantBlock {
    private final AssistantBlockType type;
    private final String title;
    private final String content;
    private final Map<String, Object> data;
}
