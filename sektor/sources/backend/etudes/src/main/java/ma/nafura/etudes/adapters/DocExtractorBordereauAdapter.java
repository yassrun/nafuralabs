package ma.nafura.etudes.adapters;

import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.service.bordereau.BordereauExtractionDiagnostics;
import ma.nafura.etudes.service.port.BordereauExtractionPort;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Façade {@link BordereauExtractionPort} : délègue au pipeline adaptatif
 * ({@link AdaptiveBordereauExtractionOrchestrator}).
 */
@Component
@Primary
public class DocExtractorBordereauAdapter implements BordereauExtractionPort {

    private final AdaptiveBordereauExtractionOrchestrator orchestrator;

    public DocExtractorBordereauAdapter(AdaptiveBordereauExtractionOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public ImportTreeRequest extract(byte[] fileBytes, String fileName, String mimeType) {
        return orchestrator.extract(fileBytes, fileName, mimeType);
    }

    @Override
    public ImportTreeRequest extract(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            ma.nafura.etudes.service.port.ExtractionProgress progress) {
        return orchestrator.extract(fileBytes, fileName, mimeType, progress);
    }

    @Override
    public BordereauExtractionDiagnostics consumeDiagnostics() {
        return orchestrator.consumeDiagnostics();
    }
}
