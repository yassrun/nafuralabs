package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DossierGoRequest {

    /** Ingénieur d'étude. Si absent : chargé déjà posé, sinon l'auteur s'il est ingénieur. */
    @Size(max = 100)
    private String chargeEtudeUserId;

    @Size(max = 255)
    private String chargeEtudeNom;

    /** Ingénieur BTP — défaut = responsable d'étude (même personne = pas d'avis). */
    @Size(max = 100)
    private String responsableExecutionUserId;

    @Size(max = 255)
    private String responsableExecutionNom;
}
