package ma.nafura.finance.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.domain.model.Caisse;
import ma.nafura.finance.domain.model.CaisseMouvement;
import ma.nafura.finance.repository.CaisseMouvementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CaisseSoldeServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CAISSE_ID = UUID.fromString("00000000-0000-4000-8000-000000000010");

    @Mock
    private CaisseMouvementRepository mouvementRepository;

    @InjectMocks
    private CaisseSoldeService service;

    @Test
    void computeBalanceFromOpeningAndValidatedMovements() {
        Caisse caisse = Caisse.builder()
                .id(CAISSE_ID)
                .openingBalance(new BigDecimal("5000"))
                .build();
        when(mouvementRepository.findByTenantIdAndCaisseIdOrderByMovementDateDescCreatedAtDesc(
                        TENANT_ID, CAISSE_ID))
                .thenReturn(List.of(
                        movement(CaisseMouvement.TYPE_DEPENSE, "1800", CaisseMouvement.STATUS_VALIDE),
                        movement(CaisseMouvement.TYPE_AVANCE_RECUE, "5000", CaisseMouvement.STATUS_VALIDE),
                        movement(CaisseMouvement.TYPE_DEPENSE, "999", CaisseMouvement.STATUS_BROUILLON)));

        BigDecimal solde = service.computeBalance(caisse, TENANT_ID);
        assertEquals(new BigDecimal("8200.00"), solde);
    }

    @Test
    void deltaJustificatifIsZero() {
        CaisseMouvement m = movement(CaisseMouvement.TYPE_JUSTIFICATIF, "100", CaisseMouvement.STATUS_VALIDE);
        assertEquals(BigDecimal.ZERO, CaisseSoldeService.delta(m));
    }

    private static CaisseMouvement movement(String type, String amount, String status) {
        return CaisseMouvement.builder()
                .movementType(type)
                .amount(new BigDecimal(amount))
                .workflowStatus(status)
                .build();
    }
}
