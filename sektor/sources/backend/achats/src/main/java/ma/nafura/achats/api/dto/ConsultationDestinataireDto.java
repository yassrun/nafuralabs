package ma.nafura.achats.api.dto;

import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConsultationDestinataireDto {

    private UUID id;
    private UUID fournisseurId;
    private String fournisseurNom;
    private UUID contactId;
    private String contactEmail;
    private String statut;
}
