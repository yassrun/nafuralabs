package ma.nafura.etudes.service.port;

import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class NoOpCpsDescriptifExtractionPort implements CpsDescriptifExtractionPort {

    @Override
    public boolean isAvailable() {
        return false;
    }

    @Override
    public List<DescriptifResult> extractDescriptifs(
            byte[] fileBytes, String fileName, String mimeType, List<PosteRef> postes) {
        return List.of();
    }
}
