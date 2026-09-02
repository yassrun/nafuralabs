package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DossierPieceAttendueCreateDto {

    @NotBlank
    @Size(max = 40)
    private String type;

    @NotBlank
    @Size(max = 255)
    private String libelle;

    /** Défaut false si absent (pièces de destination optionnelles). */
    private Boolean obligatoire;
}
