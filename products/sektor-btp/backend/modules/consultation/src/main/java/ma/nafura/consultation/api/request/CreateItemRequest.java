package ma.nafura.consultation.api.request;

import java.math.BigDecimal;
import lombok.Data;

/**
 * Create a catalog item from a poste (FOURNI) or a composant, then link it.
 * When fields are omitted, they are derived from the target node/composant.
 */
@Data
public class CreateItemRequest {

    private String name;
    private String code;
    private String description;
    private String unite;
    /** MATERIAU (material) or PRESTATION (service). */
    private String articleType;
    private BigDecimal prixUnitaire;
}
