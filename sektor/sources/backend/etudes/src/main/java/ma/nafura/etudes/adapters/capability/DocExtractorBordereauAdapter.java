package ma.nafura.etudes.adapters.capability;

import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.service.bordereau.BordereauExtractResult;
import ma.nafura.etudes.service.port.capability.BordereauExtractionPort;
import ma.nafura.etudes.service.port.capability.ExtractionProgress;
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
            byte[] fileBytes, String fileName, String mimeType, ExtractionProgress progress) {
        return orchestrator.extract(fileBytes, fileName, mimeType, progress);
    }

    @Override
    public BordereauExtractResult extractResult(
            byte[] fileBytes, String fileName, String mimeType, ExtractionProgress progress) {
        return orchestrator.extractResult(fileBytes, fileName, mimeType, progress);
    }
}
