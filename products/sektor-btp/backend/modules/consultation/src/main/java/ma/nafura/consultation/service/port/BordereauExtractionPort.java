package ma.nafura.consultation.service.port;

import ma.nafura.consultation.api.request.ImportTreeRequest;

/**
 * Turns raw uploaded documents (bordereau / CPS) into a draft consultation
 * tree. v1 default is a No-Op (manual import only); the real adapter lives in
 * the product app and uses the platform doc-extractor.
 */
public interface BordereauExtractionPort {

    boolean isAvailable();

    ImportTreeRequest extract(byte[] fileBytes, String fileName, String mimeType);
}
