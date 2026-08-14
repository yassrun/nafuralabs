package ma.nafura.marches.service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.Map;

/**
 * Coefficient K (CCAG-T) : K = (a0 + Σ ai·Mi/M0) / (a0 + Σ ai).
 */
public final class RevisionPrixKCalculator {

    private static final MathContext MC = new MathContext(12, RoundingMode.HALF_UP);
    private static final int K_SCALE = 8;

    private RevisionPrixKCalculator() {}

    public static BigDecimal calculerK(FormuleRevisionK formule, Map<String, BigDecimal> indicesPeriode) {
        if (formule == null || formule.getTermeFixe() == null) {
            throw new IllegalArgumentException("Formule revision K is required");
        }
        BigDecimal a0 = formule.getTermeFixe();
        BigDecimal numerator = a0;
        BigDecimal denominator = a0;

        for (FormuleRevisionK.TermeVariable terme : formule.getTermesVariables()) {
            if (terme.getCoefficient() == null
                    || terme.getIndiceBaseValeur() == null
                    || terme.getIndiceBaseValeur().compareTo(BigDecimal.ZERO) == 0) {
                throw new IllegalArgumentException("Invalid formula term: " + terme.getIndiceCode());
            }
            BigDecimal mi = indicesPeriode.get(terme.getIndiceCode());
            if (mi == null) {
                throw new IllegalArgumentException("Missing index for period: " + terme.getIndiceCode());
            }
            BigDecimal ratio = mi.divide(terme.getIndiceBaseValeur(), MC);
            BigDecimal ai = terme.getCoefficient();
            numerator = numerator.add(ai.multiply(ratio, MC), MC);
            denominator = denominator.add(ai, MC);
        }

        if (denominator.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Formula denominator is zero");
        }
        return numerator.divide(denominator, K_SCALE, RoundingMode.HALF_UP);
    }
}
