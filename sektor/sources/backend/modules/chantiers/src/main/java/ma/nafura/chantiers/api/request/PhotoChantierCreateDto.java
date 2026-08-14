package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import lombok.Data;

@Data
public class PhotoChantierCreateDto {

    private String filename;

    private String contentType;

    private String storagePath;

    private Double lat;

    private Double lng;

    private String zone;

    @NotNull
    private OffsetDateTime takenAt;

    private String exifJson;

    @NotBlank
    private String uploadedBy;
}
