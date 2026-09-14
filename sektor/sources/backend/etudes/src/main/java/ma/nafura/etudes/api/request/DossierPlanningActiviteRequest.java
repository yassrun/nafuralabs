package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class DossierPlanningActiviteRequest {

    @NotBlank
    @Size(max = 500)
    private String libelle;

    private UUID dpgfNoeudId;

    @Size(max = 500)
    private String lotLibelle;

    @NotNull
    private LocalDate dateDebut;

    @NotNull
    private LocalDate dateFin;
}
