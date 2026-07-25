package ma.nafura.etudes.service.port;

import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.service.bordereau.BordereauExtractionDiagnostics;

/**
 * Turns raw uploaded documents (bordereau / CPS) into a draft DPGF tree.
 * v1 default is a No-Op (manual import only); the real adapter lives in the
 * product app and uses the platform doc-extractor.
 */
public interface BordereauExtractionPort {

    boolean isAvailable();

    ImportTreeRequest extract(byte[] fileBytes, String fileName, String mimeType);

    /**
     * Diagnostics of the last {@link #extract} call (optional, for job result_json).
     */
    default BordereauExtractionDiagnostics consumeDiagnostics() {
        return BordereauExtractionDiagnostics.empty();
    }
}
