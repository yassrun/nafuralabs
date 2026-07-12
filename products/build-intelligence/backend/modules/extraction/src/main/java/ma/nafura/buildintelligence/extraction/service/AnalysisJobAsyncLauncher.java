package ma.nafura.buildintelligence.extraction.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class AnalysisJobAsyncLauncher {

    private final DocumentAnalysisService documentAnalysisService;

    public AnalysisJobAsyncLauncher(DocumentAnalysisService documentAnalysisService) {
        this.documentAnalysisService = documentAnalysisService;
    }

    @Async
    public void launch(UUID jobId) {
        documentAnalysisService.execute(jobId);
    }
}
