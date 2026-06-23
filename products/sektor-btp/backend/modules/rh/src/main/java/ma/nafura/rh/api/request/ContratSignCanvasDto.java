package ma.nafura.rh.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ContratSignCanvasDto {

    @NotBlank
    private String signatureDataUrl;
}
