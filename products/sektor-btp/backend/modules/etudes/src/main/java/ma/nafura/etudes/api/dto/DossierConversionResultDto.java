package ma.nafura.etudes.api.dto;

import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DossierConversionResultDto {
    private UUID dossierId;
    private String chantierId;
    private String marcheId;
    private String status;
}
