package ma.nafura.platform.collaboration.workflow;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ApprovalStepDefinition {
    private int stepNumber;
    private String approverRole;
    private UUID approverId;
}

