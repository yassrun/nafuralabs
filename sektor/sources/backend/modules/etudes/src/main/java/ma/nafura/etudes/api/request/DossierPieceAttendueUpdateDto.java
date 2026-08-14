package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DossierPieceAttendueUpdateDto {

    @Size(max = 255)
    private String libelle;

    private Boolean obligatoire;
}
