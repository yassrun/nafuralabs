package ma.nafura.platform.collaboration.workflow.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowStepDto {

    private UUID id;

    @NotNull
    @Min(1)
    private Integer stepNumber;

    @NotBlank
    private String name;

    @NotBlank
    private String approverRole;

    @Min(1)
    private Integer timeoutHours;

    private String escalationRole;

    private String condition;
}
