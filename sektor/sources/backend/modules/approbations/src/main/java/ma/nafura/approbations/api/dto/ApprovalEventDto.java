package ma.nafura.approbations.api.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApprovalEventDto {

    private UUID id;
    private String action;
    private String userId;
    private String userNom;
    private String commentaire;
    private String payloadJson;
    private String previousHash;
    private String eventHash;
    private OffsetDateTime createdAt;
}
