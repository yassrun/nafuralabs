package ma.nafura.platform.collaboration.workflow.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTemplateDto {

    private UUID id;
    private String code;
    private String name;
    private String entityType;
    private String description;
    private Boolean isActive;
    private Integer stepCount;
    private List<WorkflowStepDto> steps;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
