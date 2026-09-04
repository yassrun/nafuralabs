package ma.nafura.achats.api.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConsultationDestinataireDto {

    private UUID id;
    private UUID fournisseurId;
    private String fournisseurNom;
    /** Premier contact (To) — compat listing / e2e 279. */
    private UUID contactId;
    private String contactEmail;
    @Builder.Default
    private List<ConsultationDestinataireContactDto> contacts = new ArrayList<>();
    private String statut;
}
