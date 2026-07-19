package ma.nafura.consultation.service.port;

import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Fallback when no CPS descriptif adapter is wired. A real adapter should be
 * declared {@code @Primary} so it wins injection when both beans are present.
 */
@Component
public class NoOpCpsDescriptifExtractionPort implements CpsDescriptifExtractionPort {

    @Override
    public boolean isAvailable() {
        return false;
    }

    @Override
    public List<DescriptifResult> extractDescriptifs(
            byte[] fileBytes, String fileName, String mimeType, List<PosteRef> postes) {
        throw new IllegalStateException("CPS_DESCRIPTIF_EXTRACTION_UNAVAILABLE");
    }
}
