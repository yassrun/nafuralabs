package ma.nafura.catalogue.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CatalogCandidatDto {
    UUID id;
    String libellePropose;
    String nature;
    String uniteCode;
    String codeFamille;
    String typeObjet;
    int nbTenantsConfirmants;
    int seuilRequis;
    boolean eligible;
    String exemplesLibelles;
    BigDecimal rendementMin;
    BigDecimal rendementMax;
    BigDecimal rendementMedian;
    String statut;
    String proposePar;
    String modelVersion;
    String catalogCleCreee;
    OffsetDateTime createdAt;
}
