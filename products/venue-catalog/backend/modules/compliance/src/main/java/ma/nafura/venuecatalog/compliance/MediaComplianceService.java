package ma.nafura.venuecatalog.compliance;

import ma.nafura.platform.integrations.googleplaces.PlacePhotoRef;
import org.springframework.stereotype.Service;

@Service
public class MediaComplianceService {

    public void validateGooglePhoto(PlacePhotoRef photo, byte[] content) {
        if (photo == null || photo.name() == null || photo.name().isBlank()) {
            throw new MediaComplianceException("Missing provider photo reference");
        }
        if (content == null || content.length == 0) {
            throw new MediaComplianceException("Empty photo payload");
        }
        if (content.length > 5 * 1024 * 1024) {
            throw new MediaComplianceException("Photo exceeds 5MB limit");
        }
    }

    public String buildAttribution(PlacePhotoRef photo) {
        if (photo.authorAttributions() != null && !photo.authorAttributions().isEmpty()) {
            return "Photo: Google — " + photo.authorAttributions().getFirst();
        }
        return "Photo: Google";
    }
}
