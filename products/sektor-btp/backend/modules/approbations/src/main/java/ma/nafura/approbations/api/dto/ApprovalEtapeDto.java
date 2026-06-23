package ma.nafura.approbations.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApprovalEtapeDto {

    private Integer ordre;
    private String approbateurRoleId;
    private String approbateurNom;
    private String dateLimite;
    private String decision;
    private String decisionPar;
    private String decisionAt;
    private String commentaire;
}
