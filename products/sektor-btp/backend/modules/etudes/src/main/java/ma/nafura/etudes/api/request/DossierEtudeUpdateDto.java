package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

/** Mise à jour de l'en-tête. Le contenu du bordereau passe par les endpoints DPGF. */
@Data
public class DossierEtudeUpdateDto {

    @Size(max = 500)
    private String objet;

    @Size(max = 100)
    private String clientId;

    @Size(max = 255)
    private String clientNom;

    @Size(max = 100)
    private String cpsDocumentId;

    @Size(max = 100)
    private String bordereauDocumentId;

    private BigDecimal fraisGenerauxPercentDefaut;

    private BigDecimal margePercentDefaut;

    private BigDecimal tvaTauxDefaut;

    /** Sémantique non tranchée — voir Q15. Laisser null tant que ce n'est pas décidé. */
    private BigDecimal margeGlobalePercent;

    private String notes;
}
