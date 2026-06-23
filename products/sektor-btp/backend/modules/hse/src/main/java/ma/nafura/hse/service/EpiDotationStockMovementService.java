package ma.nafura.hse.service;

import ma.nafura.hse.domain.model.EpiDotation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EpiDotationStockMovementService {

    private static final Logger log = LoggerFactory.getLogger(EpiDotationStockMovementService.class);

    /**
     * Stub: full InventoryTx SORTIE integration deferred (Wave 1 Inventory).
     */
    public void triggerSortie(EpiDotation dotation) {
        log.info(
                "STUB stock SORTIE for EPI dotation id={} reference={} employeId={} articleId={}",
                dotation.getId(),
                dotation.getReference(),
                dotation.getEmployeId(),
                dotation.getArticleId());
    }
}
