package ma.nafura.finance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.domain.model.Caisse;
import ma.nafura.finance.domain.model.CaisseMouvement;
import ma.nafura.finance.repository.CaisseMouvementRepository;
import org.springframework.stereotype.Service;

@Service
public class CaisseSoldeService {

    private final CaisseMouvementRepository mouvementRepository;

    public CaisseSoldeService(CaisseMouvementRepository mouvementRepository) {
        this.mouvementRepository = mouvementRepository;
    }

    public BigDecimal computeBalance(Caisse caisse, UUID tenantId) {
        BigDecimal balance =
                caisse.getOpeningBalance() != null ? caisse.getOpeningBalance() : BigDecimal.ZERO;
        List<CaisseMouvement> mouvements =
                mouvementRepository.findByTenantIdAndCaisseIdOrderByMovementDateDescCreatedAtDesc(
                        tenantId, caisse.getId());
        for (CaisseMouvement m : mouvements) {
            if (!CaisseMouvement.STATUS_VALIDE.equals(m.getWorkflowStatus())) {
                continue;
            }
            balance = balance.add(delta(m));
        }
        return balance.setScale(2, RoundingMode.HALF_UP);
    }

    static BigDecimal delta(CaisseMouvement movement) {
        if (CaisseMouvement.TYPE_AVANCE_RECUE.equals(movement.getMovementType())) {
            return movement.getAmount();
        }
        if (CaisseMouvement.TYPE_RETOUR.equals(movement.getMovementType())
                || CaisseMouvement.TYPE_JUSTIFICATIF.equals(movement.getMovementType())) {
            return BigDecimal.ZERO;
        }
        return movement.getAmount().negate();
    }
}
