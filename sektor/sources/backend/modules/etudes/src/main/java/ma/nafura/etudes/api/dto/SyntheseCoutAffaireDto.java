package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import java.util.Map;
import lombok.Builder;
import lombok.Value;

/**
 * Synthèse des coûts d'affaire (L1) — projection, pas une table.
 * La marge exclut les lignes {@code cout_deduit}.
 */
@Value
@Builder
public class SyntheseCoutAffaireDto {
    BigDecimal montantTotalHt;
    BigDecimal coutTotalEtabli;
    BigDecimal margeSurCoutsEtablis;
    BigDecimal margePercentSurCoutsEtablis;
    BigDecimal montantCoutsDeduits;
    BigDecimal partCoutsNonEtablisPercent;
    /** Parts en montant : DECOMPOSE, FORFAIT, ESTIME, DEDUIT */
    Map<String, BigDecimal> repartitionMontantParOrigine;
    Map<String, BigDecimal> repartitionPercentParOrigine;
}
