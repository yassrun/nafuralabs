package ma.nafura.chantiers.api.dto;

import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PhotoChantierDto {

    private String id;
    private String chantierId;
    private String chantierCode;
    private String filename;
    private String contentType;
    private String storagePath;
    private Double lat;
    private Double lng;
    private String zone;
    private OffsetDateTime takenAt;
    private String exifJson;
    private String uploadedBy;
    private OffsetDateTime createdAt;
    private String contentUrl;
}
