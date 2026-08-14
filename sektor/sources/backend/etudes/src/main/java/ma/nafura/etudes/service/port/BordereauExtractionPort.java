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
     * Same as {@link #extract(byte[], String, String)} with live progress for the UI
     * (e.g. vision page N / total).
     */
    default ImportTreeRequest extract(
            byte[] fileBytes, String fileName, String mimeType, ExtractionProgress progress) {
        return extract(fileBytes, fileName, mimeType);
    }

    /**
     * Diagnostics of the last {@link #extract} call (optional, for job result_json).
     */
    default BordereauExtractionDiagnostics consumeDiagnostics() {
        return BordereauExtractionDiagnostics.empty();
    }
}
