package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DemandeAchatRejectDto {

    @NotBlank
    private String motifRejet;
}
