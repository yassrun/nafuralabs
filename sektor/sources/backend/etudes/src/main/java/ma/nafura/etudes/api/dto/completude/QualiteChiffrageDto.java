package ma.nafura.etudes.api.dto.completude;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Value;

/**
 * Indicateurs de qualité du chiffrage (SEKTOR-211 AC-4).
 *
 * <p>{@link #ratioComposantsAffichage} vaut « aucun composant » lorsque {@code composantsTotal = 0},
 * jamais « 0 / 0 (100 %) ».
 */
@Value
@Builder
public class QualiteChiffrageDto {

    BigDecimal partEtablie;
    BigDecimal partEstimee;
    int composantsTotal;
    int composantsControles;
    /** Libellé prêt à l'affichage : « aucun composant » ou « 3 / 5 ». */
    String ratioComposantsAffichage;
}
