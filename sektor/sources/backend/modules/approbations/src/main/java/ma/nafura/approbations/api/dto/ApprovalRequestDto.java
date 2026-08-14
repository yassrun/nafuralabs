package ma.nafura.approbations.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApprovalRequestDto {

    private String id;
    private String workflowId;
    private String entityType;
    private String entityId;
    private String entityRef;
    private String entitySummary;
    private BigDecimal montantConcerne;
    private String chantierId;
    private String initiateurUserId;
    private String initiateurNom;
    private String status;
    private Integer etapeCouranteIndex;
    private LocalDate dateSoumission;
    private LocalDate dateCloture;
    private String urgence;
    private OffsetDateTime createdAt;
    private List<ApprovalEtapeDto> etapes;
    private List<ApprovalEventDto> historique;
}
