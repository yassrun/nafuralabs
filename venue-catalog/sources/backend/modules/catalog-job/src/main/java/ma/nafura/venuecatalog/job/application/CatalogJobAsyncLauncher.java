package ma.nafura.venuecatalog.job.application;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CatalogJobAsyncLauncher {

    private final CatalogJobService catalogJobService;

    public CatalogJobAsyncLauncher(CatalogJobService catalogJobService) {
        this.catalogJobService = catalogJobService;
    }

    @Async
    public void launch(UUID jobId) {
        catalogJobService.execute(jobId);
    }
}
