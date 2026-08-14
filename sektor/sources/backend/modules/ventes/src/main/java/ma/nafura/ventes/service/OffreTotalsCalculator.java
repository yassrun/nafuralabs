package ma.nafura.ventes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import ma.nafura.ventes.domain.model.Offre;
import ma.nafura.ventes.domain.model.OffreLigne;

final class OffreTotalsCalculator {

    private OffreTotalsCalculator() {}

    static void applyTotals(Offre entity) {
        BigDecimal totalHt = computeTotalHt(entity.getLignes());
        BigDecimal tvaTaux = entity.getTvaTaux() != null ? entity.getTvaTaux() : new BigDecimal("20");
        BigDecimal totalTva = totalHt.multiply(tvaTaux).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        entity.setTotalHt(totalHt);
        entity.setTvaTaux(tvaTaux);
        entity.setTotalTva(totalTva);
        entity.setTotalTtc(totalHt.add(totalTva));
    }

    private static BigDecimal computeTotalHt(List<OffreLigne> lignes) {
        if (lignes == null || lignes.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return lignes.stream()
                .map(l -> l.getTotalHt() != null ? l.getTotalHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
