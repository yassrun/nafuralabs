package ma.nafura.ventes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import ma.nafura.ventes.domain.model.FactureClient;
import ma.nafura.ventes.domain.model.FactureClientLigne;

final class FactureClientTotalsCalculator {

    static final BigDecimal DEFAULT_RG_SITUATION_TAUX = new BigDecimal("7");
    static final BigDecimal DEFAULT_RAS_MARCHE_PUBLIC_TAUX = new BigDecimal("5");
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private FactureClientTotalsCalculator() {}

    static void applyTotals(FactureClient entity, ChantierRates chantierRates) {
        BigDecimal totalHt = computeTotalHt(entity.getLignes());
        BigDecimal tvaTaux = entity.getTvaTaux() != null ? entity.getTvaTaux() : new BigDecimal("20");

        BigDecimal rgTaux = entity.getRetenueGarantieTaux() != null
                ? entity.getRetenueGarantieTaux()
                : BigDecimal.ZERO;
        BigDecimal retenueGarantieMontant =
                percentOf(totalHt, rgTaux).setScale(4, RoundingMode.HALF_UP);

        BigDecimal resorption = entity.getResorptionAvanceMontant() != null
                ? entity.getResorptionAvanceMontant()
                : BigDecimal.ZERO;
        BigDecimal netAPayerHt = totalHt
                .subtract(retenueGarantieMontant)
                .subtract(resorption)
                .max(BigDecimal.ZERO)
                .setScale(4, RoundingMode.HALF_UP);

        BigDecimal totalTva = percentOf(netAPayerHt, tvaTaux).setScale(4, RoundingMode.HALF_UP);
        BigDecimal baseTtc = netAPayerHt.add(totalTva).setScale(4, RoundingMode.HALF_UP);

        BigDecimal rasTaux = resolveRasTaux(entity, chantierRates);
        BigDecimal rasMontant = rasTaux.compareTo(BigDecimal.ZERO) > 0
                ? percentOf(netAPayerHt, rasTaux).setScale(4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal netAPayerTtc = baseTtc.subtract(rasMontant).setScale(4, RoundingMode.HALF_UP);

        BigDecimal cumul = entity.getCumulEncaisseTtc() != null ? entity.getCumulEncaisseTtc() : BigDecimal.ZERO;

        entity.setRetenueGarantieTaux(rgTaux);
        entity.setRetenueGarantieMontant(retenueGarantieMontant);
        entity.setNetAPayerHt(netAPayerHt);
        entity.setTotalHt(totalHt);
        entity.setTvaTaux(tvaTaux);
        entity.setTotalTva(totalTva);
        entity.setRasTaux(rasTaux);
        entity.setRasMontant(rasMontant);
        entity.setNetAPayerTtc(netAPayerTtc);
        entity.setResteTtc(netAPayerTtc.subtract(cumul).max(BigDecimal.ZERO).setScale(4, RoundingMode.HALF_UP));
    }

    static void applyTotals(FactureClient entity) {
        applyTotals(entity, ChantierRates.empty());
    }

    private static BigDecimal resolveRasTaux(FactureClient entity, ChantierRates chantierRates) {
        if (!Boolean.TRUE.equals(entity.getMarchePublic())) {
            return BigDecimal.ZERO;
        }
        if (chantierRates != null
                && chantierRates.rasTaux() != null
                && chantierRates.rasTaux().compareTo(BigDecimal.ZERO) > 0) {
            return chantierRates.rasTaux();
        }
        return DEFAULT_RAS_MARCHE_PUBLIC_TAUX;
    }

    private static BigDecimal percentOf(BigDecimal base, BigDecimal percent) {
        if (base == null || percent == null || percent.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return base.multiply(percent).divide(HUNDRED, 4, RoundingMode.HALF_UP);
    }

    private static BigDecimal computeTotalHt(List<FactureClientLigne> lignes) {
        if (lignes == null || lignes.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return lignes.stream()
                .map(l -> l.getTotalHt() != null ? l.getTotalHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    record ChantierRates(BigDecimal retenueGarantieTaux, BigDecimal rasTaux) {

        static ChantierRates empty() {
            return new ChantierRates(null, null);
        }
    }
}
