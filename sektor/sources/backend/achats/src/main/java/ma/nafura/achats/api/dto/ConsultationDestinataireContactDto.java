package ma.nafura.achats.api.dto;

import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConsultationDestinataireContactDto {

    private UUID id;
    private String nom;
    private String email;
}
