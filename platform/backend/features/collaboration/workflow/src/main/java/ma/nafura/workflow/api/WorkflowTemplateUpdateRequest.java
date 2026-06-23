package ma.nafura.platform.collaboration.workflow.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTemplateUpdateRequest {

    @NotBlank
    private String code;

    @NotBlank
    private String name;

    @NotBlank
    private String entityType;

    private String description;

    @NotNull
    private Boolean isActive;

    @NotNull
    @Valid
    private List<WorkflowStepDto> steps;
}
