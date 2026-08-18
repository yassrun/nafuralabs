package ma.nafura.platform.ai.agent.service.navigation;

import java.util.List;
import lombok.Builder;
import lombok.Getter;
import ma.nafura.platform.ai.agent.model.AssistantLink;

@Getter
@Builder
public class HelpEntry {
    private final List<String> keywords;
    private final String answer;
    private final List<AssistantLink> links;
}
