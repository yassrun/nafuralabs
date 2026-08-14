package ma.nafura.socle.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApprovalEtapeDto {

    private Integer ordre;
    private String approbateurRoleId;
    private String approbateurNom;
    /** Resolved app_user id when known (chantier affectation). */
    private String approbateurUserId;
    private String dateLimite;
    private String decision;
    private String decisionPar;
    private String decisionAt;
    private String commentaire;
}
