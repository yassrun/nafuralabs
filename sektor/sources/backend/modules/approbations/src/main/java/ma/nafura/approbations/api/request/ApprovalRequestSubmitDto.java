package ma.nafura.approbations.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ApprovalRequestSubmitDto {

    private String id;

    @NotBlank
    private String entityType;

    @NotBlank
    private String entityId;

    @NotBlank
    private String entityRef;

    @NotBlank
    private String entitySummary;

    private BigDecimal montantConcerne;
    private String chantierId;
    private String initiateurUserId;
    private String initiateurNom;
    private String urgence;
}
