package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DpgfLotAffectationRequest {

    /** Ingénieur BTP. Absent ou vide = retirer l'affectation. */
    @Size(max = 100)
    private String userId;

    @Size(max = 255)
    private String nom;
}
