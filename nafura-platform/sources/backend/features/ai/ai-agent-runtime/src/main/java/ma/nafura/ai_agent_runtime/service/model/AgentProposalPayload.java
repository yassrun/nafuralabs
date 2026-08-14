package ma.nafura.platform.ai.agent.service.model;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AgentProposalPayload {
    private String summary;
    private List<AgentProposalAction> actions = new ArrayList<>();
}

