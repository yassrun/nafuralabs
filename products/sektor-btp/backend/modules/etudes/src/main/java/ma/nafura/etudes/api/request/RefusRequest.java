package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Le motif est obligatoire : un refus sans motif n'est pas exploitable par le rédacteur. */
@Data
public class RefusRequest {

    @NotBlank
    @Size(max = 1000)
    private String motif;
}
