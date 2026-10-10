package ma.nafura.platform.collaboration.workflow;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalStepDefinition {
    private int stepNumber;
    private String approverPermission;
    private UUID approverId;
}
