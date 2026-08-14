package ma.nafura.approbations.api.request;

import lombok.Data;

@Data
public class ApprovalWorkflowUpdateDto {

    private String code;
    private String label;
    private String entityType;
    private String conditionsJson;
    private String etapesJson;
    private Integer slaJours;
    private Integer escaladeApresJours;
    private Boolean isActive;
}
