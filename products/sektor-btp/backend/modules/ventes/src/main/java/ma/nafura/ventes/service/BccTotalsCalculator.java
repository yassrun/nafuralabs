package ma.nafura.ventes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import ma.nafura.ventes.domain.model.BonCommandeClient;
import ma.nafura.ventes.domain.model.BonCommandeClientLigne;

final class BccTotalsCalculator {

    private BccTotalsCalculator() {}

    static void applyTotals(BonCommandeClient entity) {
        BigDecimal montantHt = computeMontantHt(entity.getLignes());
        BigDecimal tvaTaux = entity.getTvaTaux() != null ? entity.getTvaTaux() : new BigDecimal("20");
        BigDecimal montantTtc = montantHt.multiply(BigDecimal.ONE.add(tvaTaux.divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP)))
                .setScale(4, RoundingMode.HALF_UP);
        entity.setMontantHt(montantHt);
        entity.setTvaTaux(tvaTaux);
        entity.setMontantTtc(montantTtc);
    }

    private static BigDecimal computeMontantHt(List<BonCommandeClientLigne> lignes) {
        if (lignes == null || lignes.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return lignes.stream()
                .map(l -> l.getTotalHt() != null ? l.getTotalHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
