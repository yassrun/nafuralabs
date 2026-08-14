package ma.nafura.ventes.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import ma.nafura.ventes.domain.model.FactureClient;
import org.junit.jupiter.api.Test;

class EncaissementClientServiceTest {

    @Test
    void applyPaymentStatus_fullPayment_setsPayee() {
        FactureClient facture = facture(FactureClient.STATUS_EMISE, "100000");
        EncaissementClientService.applyPaymentStatus(facture, new BigDecimal("100000"));
        assertEquals(FactureClient.STATUS_PAYEE, facture.getStatus());
    }

    @Test
    void applyPaymentStatus_partialPayment_setsPartiellementPayee() {
        FactureClient facture = facture(FactureClient.STATUS_EMISE, "100000");
        EncaissementClientService.applyPaymentStatus(facture, new BigDecimal("40000"));
        assertEquals(FactureClient.STATUS_PARTIELLEMENT_PAYEE, facture.getStatus());
    }

    @Test
    void applyPaymentStatus_removedAllPayments_revertsToEmise() {
        FactureClient facture = facture(FactureClient.STATUS_PARTIELLEMENT_PAYEE, "100000");
        EncaissementClientService.applyPaymentStatus(facture, BigDecimal.ZERO);
        assertEquals(FactureClient.STATUS_EMISE, facture.getStatus());
    }

    @Test
    void applyPaymentStatus_skipsNonEligibleStatuses() {
        FactureClient facture = facture(FactureClient.STATUS_BROUILLON, "100000");
        EncaissementClientService.applyPaymentStatus(facture, new BigDecimal("100000"));
        assertEquals(FactureClient.STATUS_BROUILLON, facture.getStatus());
    }

    private static FactureClient facture(String status, String netAPayerTtc) {
        return FactureClient.builder()
                .status(status)
                .netAPayerTtc(new BigDecimal(netAPayerTtc))
                .build();
    }
}
