package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

/**
 * Création d'un DPU — exactement l'un de {@code ouvrageId} (bibliothèque) ou
 * {@code dpgfNoeudId} (poste de bordereau) doit être renseigné.
 */
@Data
public class PrixDpuCreateDto {

    private UUID ouvrageId;

    private UUID dpgfNoeudId;

    private BigDecimal fraisGenerauxPercent;

    private BigDecimal margeBeneficiairePercent;

    private BigDecimal tvaTaux;
}
