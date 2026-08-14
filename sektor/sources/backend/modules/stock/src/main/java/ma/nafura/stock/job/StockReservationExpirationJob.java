package ma.nafura.stock.job;

import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.stock.service.StockReservationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class StockReservationExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(StockReservationExpirationJob.class);

    private final StockReservationService stockReservationService;

    public StockReservationExpirationJob(StockReservationService stockReservationService) {
        this.stockReservationService = stockReservationService;
    }

    /** Expires ACTIVE reservations past {@code dateExpiration} (runs daily at 01:00). */
    @Scheduled(cron = "0 0 1 * * ?")
    public void expireReservations() {
        if (!TenantContext.isTenantEnabled() || TenantContext.getTenantIdOrNull() == null) {
            return;
        }
        int count = stockReservationService.expireActivePastDue();
        if (count > 0) {
            log.info("Expired {} stock reservation(s)", count);
        }
    }
}
