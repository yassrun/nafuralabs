package ma.nafura.etudes.service.extraction;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Poller des jobs d'extraction documentaire.
 *
 * <p>Claim Postgres ({@code FOR UPDATE SKIP LOCKED}) : plusieurs instances ERP peuvent poller
 * sans broker. Le traitement LLM tourne hors transaction longue.
 */
@Component
public class DocumentExtractionJobWorker {

    private static final Logger log = LoggerFactory.getLogger(DocumentExtractionJobWorker.class);

    private final DocumentExtractionJobService jobService;
    private final String workerId = "erp-" + UUID.randomUUID().toString().substring(0, 8);

    public DocumentExtractionJobWorker(DocumentExtractionJobService jobService) {
        this.jobService = jobService;
    }

    @Scheduled(fixedDelayString = "${nafura.etudes.extraction.poll-ms:2000}")
    public void poll() {
        try {
            // Drain a few jobs per tick so a backlog does not wait another full delay each time.
            for (int i = 0; i < 3; i++) {
                if (!jobService.claimAndExecuteNext(workerId)) {
                    break;
                }
            }
        } catch (Exception ex) {
            log.warn("Extraction job poller error: {}", ex.getMessage());
        }
    }
}
