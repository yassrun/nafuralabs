package ma.nafura.etudes.service.port.capability;

import ma.nafura.etudes.api.request.ImportTreeRequest;
import org.springframework.stereotype.Component;

/**
 * Fallback when no extraction adapter is wired: extraction unavailable, only
 * manual tree import is supported. A real adapter should be declared as
 * {@code @Primary} so it wins injection when both beans are present.
 */
@Component
public class NoOpBordereauExtractionPort implements BordereauExtractionPort {

    @Override
    public boolean isAvailable() {
        return false;
    }

    @Override
    public ImportTreeRequest extract(byte[] fileBytes, String fileName, String mimeType) {
        throw new IllegalStateException("BORDEREAU_EXTRACTION_UNAVAILABLE");
    }
}
