package ma.nafura.consultation.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import ma.nafura.consultation.domain.model.ConsultationComposant;
import org.springframework.stereotype.Component;

/**
 * Local pricing math aligned with études DPU (no cross-module dependency).
 * {@code prixVenteHt = deboursSec × (1 + fg%/100) × (1 + marge%/100)}.
 */
@Component
public class ConsultationPricingCalculator {

    private static final int MONEY_SCALE = 2;

    public BigDecimal computeLineTotal(BigDecimal quantite, BigDecimal prixUnitaire) {
        BigDecimal q = quantite != null ? quantite.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal pu = prixUnitaire != null ? prixUnitaire.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        return q.multiply(pu).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public BigDecimal computeDeboursSec(List<ConsultationComposant> composants) {
        if (composants == null || composants.isEmpty()) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (ConsultationComposant c : composants) {
            BigDecimal total = c.getTotal();
            if (total == null) {
                BigDecimal q = c.getQuantite() != null ? c.getQuantite() : c.getQuantiteIndicative();
                total = computeLineTotal(q, c.getPrixUnitaire());
            }
            sum = sum.add(total);
        }
        return sum.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public BigDecimal computePrixVenteHt(
            BigDecimal deboursSec, BigDecimal fraisGenerauxPercent, BigDecimal margePercent) {
        BigDecimal debourse = deboursSec != null ? deboursSec.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal fg = fraisGenerauxPercent != null ? fraisGenerauxPercent.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal marge = margePercent != null ? margePercent.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        return debourse
                .multiply(BigDecimal.ONE.add(fg.movePointLeft(2)))
                .multiply(BigDecimal.ONE.add(marge.movePointLeft(2)))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}
