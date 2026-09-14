package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DossierRefusChargeRequest {

    /** CPS_INCOMPLET | DOC_MANQUANT | AUTRE */
    @NotBlank
    @Size(max = 40)
    private String type;

    @NotBlank
    @Size(max = 4000)
    private String motif;
}
