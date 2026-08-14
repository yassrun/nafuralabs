package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AvisExecutionTraiterDto {

    /** PRIS_EN_COMPTE | ECARTE */
    @NotBlank
    private String statut;

    /** Obligatoire si statut = ECARTE */
    private String motifTraitement;
}
