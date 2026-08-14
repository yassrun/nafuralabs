package ma.nafura.catalogue.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RapprochementCandidatDto {
    String catalogCle;
    String libelle;
    String nature;
    String uniteCode;
    String methode;
    BigDecimal confiance;
    UUID matchId;
    String statut;
}
