package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DossierNoGoRequest {

    @Size(max = 1000)
    private String motif;
}
