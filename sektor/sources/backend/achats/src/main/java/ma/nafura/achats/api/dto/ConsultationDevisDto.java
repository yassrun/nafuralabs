package ma.nafura.achats.api.dto;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConsultationDevisDto {

    private UUID id;
    private String fichierNom;
    private OffsetDateTime createdAt;
    @Builder.Default
    private List<ConsultationDevisLigneDto> lignes = new ArrayList<>();
}
