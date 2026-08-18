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
public class WorkflowTemplateCreateRequest {

    @NotBlank
    private String code;

    @NotBlank
    private String name;

    @NotBlank
    private String entityType;

    private String description;

    @Builder.Default
    private Boolean isActive = true;

    @NotNull
    @Valid
    @Builder.Default
    private List<WorkflowStepDto> steps = List.of();
}
