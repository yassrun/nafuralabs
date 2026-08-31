package ma.nafura.achats.api.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConsultationEnvoiDto {

    private UUID id;
    private UUID destinataireId;
    private String destinataireNom;
    private String email;
    private OffsetDateTime sentAt;
}
