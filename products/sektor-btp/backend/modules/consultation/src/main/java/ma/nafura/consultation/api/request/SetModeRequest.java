package ma.nafura.consultation.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SetModeRequest {

    /** FOURNI or DECOMPOSE. */
    @NotBlank
    private String mode;
}
