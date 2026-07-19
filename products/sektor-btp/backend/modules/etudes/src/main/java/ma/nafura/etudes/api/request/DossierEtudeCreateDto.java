package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.Data;

@Data
public class DossierEtudeCreateDto {

    @NotBlank
    @Size(max = 500)
    private String objet;

    /** Optionnel — généré (DE-NNNN) si absent. */
    @Size(max = 50)
    private String numero;

    @Size(max = 100)
    private String clientId;

    @Size(max = 255)
    private String clientNom;

    @Size(max = 100)
    private String cpsDocumentId;

    @Size(max = 100)
    private String bordereauDocumentId;

    private UUID appelOffreClientId;

    /** ETUDE (défaut) ou MARCHE_EXISTANT — cf. entrée B du lot 7. */
    @Size(max = 30)
    private String origine;

    private String notes;
}
