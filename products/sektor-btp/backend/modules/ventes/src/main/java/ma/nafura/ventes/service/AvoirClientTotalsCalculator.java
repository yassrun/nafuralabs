package ma.nafura.ventes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import ma.nafura.ventes.domain.model.AvoirClient;
import ma.nafura.ventes.domain.model.AvoirClientLigne;

final class AvoirClientTotalsCalculator {

    private AvoirClientTotalsCalculator() {}

    static void applyTotals(AvoirClient entity) {
        BigDecimal totalHt = computeTotalHt(entity.getLignes());
        BigDecimal tvaTaux = entity.getTvaTaux() != null ? entity.getTvaTaux() : new BigDecimal("20");
        BigDecimal totalTva = totalHt.multiply(tvaTaux).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        BigDecimal totalTtc = totalHt.add(totalTva);
        entity.setTotalHt(totalHt);
        entity.setTvaTaux(tvaTaux);
        entity.setTotalTva(totalTva);
        entity.setTotalTtc(totalTtc);
    }

    private static BigDecimal computeTotalHt(List<AvoirClientLigne> lignes) {
        if (lignes == null || lignes.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return lignes.stream()
                .map(l -> l.getTotalHt() != null ? l.getTotalHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
