package ma.nafura.ventes.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.List;
import ma.nafura.ventes.domain.model.FactureClient;
import ma.nafura.ventes.domain.model.FactureClientLigne;
import ma.nafura.ventes.service.FactureClientTotalsCalculator.ChantierRates;
import org.junit.jupiter.api.Test;

class FactureClientTotalsCalculatorTest {

    @Test
    void applyTotals_diverseFacture_noRgNoRas() {
        FactureClient facture = baseFacture(FactureClient.TYPE_DIVERSE, "100000");
        facture.setRetenueGarantieTaux(BigDecimal.ZERO);
        facture.setMarchePublic(false);

        FactureClientTotalsCalculator.applyTotals(facture, ChantierRates.empty());

        assertAmount("100000", facture.getTotalHt());
        assertAmount("0", facture.getRetenueGarantieMontant());
        assertAmount("100000", facture.getNetAPayerHt());
        assertAmount("20000", facture.getTotalTva());
        assertAmount("0", facture.getRasMontant());
        assertAmount("120000", facture.getNetAPayerTtc());
    }

    @Test
    void applyTotals_situation_appliesRetenueGarantieOnHt() {
        FactureClient facture = baseFacture(FactureClient.TYPE_SITUATION, "100000");
        facture.setRetenueGarantieTaux(new BigDecimal("7"));
        facture.setMarchePublic(false);

        FactureClientTotalsCalculator.applyTotals(facture, ChantierRates.empty());

        assertAmount("7000", facture.getRetenueGarantieMontant());
        assertAmount("93000", facture.getNetAPayerHt());
        assertAmount("18600", facture.getTotalTva());
        assertAmount("111600", facture.getNetAPayerTtc());
    }

    @Test
    void applyTotals_withResorptionAvance() {
        FactureClient facture = baseFacture(FactureClient.TYPE_SITUATION, "100000");
        facture.setRetenueGarantieTaux(new BigDecimal("7"));
        facture.setResorptionAvanceMontant(new BigDecimal("10000"));
        facture.setMarchePublic(false);

        FactureClientTotalsCalculator.applyTotals(facture, ChantierRates.empty());

        assertAmount("83000", facture.getNetAPayerHt());
        assertAmount("99600", facture.getNetAPayerTtc());
    }

    @Test
    void applyTotals_marchePublic_appliesRasOnNetHt() {
        FactureClient facture = baseFacture(FactureClient.TYPE_SITUATION, "100000");
        facture.setRetenueGarantieTaux(new BigDecimal("7"));
        facture.setMarchePublic(true);

        FactureClientTotalsCalculator.applyTotals(facture, ChantierRates.empty());

        assertAmount("93000", facture.getNetAPayerHt());
        assertAmount("5", facture.getRasTaux());
        assertAmount("4650", facture.getRasMontant());
        assertAmount("106950", facture.getNetAPayerTtc());
    }

    @Test
    void applyTotals_chantierRasTauxOverridesDefaultFivePercent() {
        FactureClient facture = baseFacture(FactureClient.TYPE_DIVERSE, "50000");
        facture.setRetenueGarantieTaux(BigDecimal.ZERO);
        facture.setMarchePublic(true);

        FactureClientTotalsCalculator.applyTotals(
                facture, new ChantierRates(null, new BigDecimal("3")));

        assertAmount("3", facture.getRasTaux());
        assertAmount("1500", facture.getRasMontant());
        assertAmount("58500", facture.getNetAPayerTtc());
    }

    @Test
    void applyTotals_resteTtcSubtractsEncaissements() {
        FactureClient facture = baseFacture(FactureClient.TYPE_DIVERSE, "10000");
        facture.setRetenueGarantieTaux(BigDecimal.ZERO);
        facture.setMarchePublic(false);
        facture.setCumulEncaisseTtc(new BigDecimal("5000"));

        FactureClientTotalsCalculator.applyTotals(facture, ChantierRates.empty());

        assertAmount("12000", facture.getNetAPayerTtc());
        assertAmount("7000", facture.getResteTtc());
    }

    private static void assertAmount(String expected, BigDecimal actual) {
        assertTrue(
                new BigDecimal(expected).compareTo(actual) == 0,
                () -> "expected " + expected + " but was " + actual);
    }

    private static FactureClient baseFacture(String type, String totalHt) {
        FactureClientLigne ligne = FactureClientLigne.builder()
                .designation("Travaux")
                .totalHt(new BigDecimal(totalHt))
                .build();
        return FactureClient.builder()
                .type(type)
                .tvaTaux(new BigDecimal("20"))
                .cumulEncaisseTtc(BigDecimal.ZERO)
                .lignes(List.of(ligne))
                .build();
    }
}
