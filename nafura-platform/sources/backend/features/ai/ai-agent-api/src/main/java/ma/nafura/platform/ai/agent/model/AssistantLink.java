package ma.nafura.platform.ai.agent.model;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AssistantLink {
    private final String label;
    private final String route;
    private final String icon;
    /** When true the frontend may navigate automatically after rendering. */
    private final boolean autoNavigate;
}
