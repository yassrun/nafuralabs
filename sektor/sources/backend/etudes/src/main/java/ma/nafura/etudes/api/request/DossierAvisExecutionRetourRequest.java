package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DossierAvisExecutionRetourRequest {

    @NotBlank
    @Size(max = 4000)
    private String commentaire;
}
