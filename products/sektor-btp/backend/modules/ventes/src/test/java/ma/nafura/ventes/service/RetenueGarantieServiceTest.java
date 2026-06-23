package ma.nafura.ventes.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import ma.nafura.ventes.domain.model.RetenueGarantie;
import org.junit.jupiter.api.Test;

class RetenueGarantieServiceTest {

    @Test
    void resolveStatutAfterRestitution_totalWhenFullyRestituted() {
        assertEquals(
                RetenueGarantie.STATUT_RESTITUEE_TOTAL,
                RetenueGarantieService.resolveStatutAfterRestitution(
                        new BigDecimal("1000"), new BigDecimal("1000")));
    }

    @Test
    void resolveStatutAfterRestitution_partialWhenBelowCumul() {
        assertEquals(
                RetenueGarantie.STATUT_RESTITUEE_PARTIEL,
                RetenueGarantieService.resolveStatutAfterRestitution(
                        new BigDecimal("500"), new BigDecimal("1000")));
    }
}
