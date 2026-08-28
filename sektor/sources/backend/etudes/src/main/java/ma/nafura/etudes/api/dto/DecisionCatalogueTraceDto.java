package ma.nafura.etudes.api.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

/** Trace persistée d'une décision Catalogue sur un composant (SEKTOR-215 AC-10). */
@Value
@Builder
public class DecisionCatalogueTraceDto {

    UUID composantId;
    String libelle;
    String decision;
    UUID itemId;
    String itemCode;
    String itemName;
    String acteur;
    OffsetDateTime date;
    String motif;
}
