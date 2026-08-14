package ma.nafura.approbations.api.request;

import lombok.Data;

@Data
public class ApprovalActionDto {

    private String userId;
    private String userNom;
    private String commentaire;
    private String payloadJson;
}
