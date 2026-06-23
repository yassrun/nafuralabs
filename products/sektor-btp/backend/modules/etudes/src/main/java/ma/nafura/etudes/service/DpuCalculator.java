package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import ma.nafura.etudes.domain.model.ComposantDpu;
import org.springframework.stereotype.Service;

@Service
public class DpuCalculator {

    private static final int MONEY_SCALE = 2;

    public BigDecimal computeLineTotal(BigDecimal quantite, BigDecimal prixUnitaire) {
        BigDecimal q = quantite != null ? quantite.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal pu = prixUnitaire != null ? prixUnitaire.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        return q.multiply(pu).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public BigDecimal computeDeboursSec(List<ComposantDpu> composants) {
        if (composants == null || composants.isEmpty()) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (ComposantDpu composant : composants) {
            BigDecimal total = composant.getTotal();
            if (total == null) {
                total = computeLineTotal(composant.getQuantite(), composant.getPrixUnitaire());
            }
            sum = sum.add(total);
        }
        return sum.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public BigDecimal computePrixVenteHt(
            BigDecimal deboursSec, BigDecimal fraisGenerauxPercent, BigDecimal margeBeneficiairePercent) {
        BigDecimal debourse = deboursSec != null ? deboursSec.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal fg = fraisGenerauxPercent != null ? fraisGenerauxPercent.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal marge =
                margeBeneficiairePercent != null ? margeBeneficiairePercent.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        return debourse
                .multiply(BigDecimal.ONE.add(fg.movePointLeft(2)))
                .multiply(BigDecimal.ONE.add(marge.movePointLeft(2)))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public BigDecimal computePrixVenteTtc(BigDecimal prixVenteHt, BigDecimal tvaTaux) {
        BigDecimal ht = prixVenteHt != null ? prixVenteHt.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        BigDecimal tva = tvaTaux != null ? tvaTaux.max(BigDecimal.ZERO) : BigDecimal.ZERO;
        return ht.multiply(BigDecimal.ONE.add(tva.movePointLeft(2)))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public void recomputeLineTotals(List<ComposantDpu> composants) {
        if (composants == null) {
            return;
        }
        for (ComposantDpu composant : composants) {
            composant.setTotal(computeLineTotal(composant.getQuantite(), composant.getPrixUnitaire()));
        }
    }
}
