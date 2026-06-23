package ma.nafura.approbations.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ApprovalWorkflowCreateDto {

    private String id;

    @NotBlank
    private String code;

    @NotBlank
    private String label;

    @NotBlank
    private String entityType;

    private String conditionsJson;

    @NotBlank
    private String etapesJson;

    @NotNull
    private Integer slaJours;

    private Integer escaladeApresJours;

    private Boolean isActive;
}
