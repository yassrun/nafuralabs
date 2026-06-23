package ma.nafura.platform.ai.agent.service.model;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class AgentProposalAction {
    private String toolKey;
    private String title;
    private String actionKey;
    private String permissionKey;
    private String entitlementKey;
    private Boolean requiresApproval;
    private Map<String, Object> args;
}

