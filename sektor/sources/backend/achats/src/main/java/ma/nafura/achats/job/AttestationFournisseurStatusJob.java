package ma.nafura.achats.job;

import ma.nafura.achats.service.AttestationFournisseurService;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AttestationFournisseurStatusJob {

    private static final Logger log = LoggerFactory.getLogger(AttestationFournisseurStatusJob.class);

    private final AttestationFournisseurService attestationFournisseurService;

    public AttestationFournisseurStatusJob(AttestationFournisseurService attestationFournisseurService) {
        this.attestationFournisseurService = attestationFournisseurService;
    }

    /** Recalculates attestation validity statuses daily at 01:00 (tenant-scoped when context is set). */
    @Scheduled(cron = "0 0 1 * * ?")
    public void recomputeStatuses() {
        if (!TenantContext.isTenantEnabled() || TenantContext.getTenantIdOrNull() == null) {
            return;
        }
        int updated = attestationFournisseurService.recomputeStatusForTenant();
        if (updated > 0) {
            log.info("Recomputed status for {} attestation(s)", updated);
        }
    }
}
