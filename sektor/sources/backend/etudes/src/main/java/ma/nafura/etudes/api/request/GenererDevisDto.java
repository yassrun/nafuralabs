package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Optionnel : Partner CLIENT déjà créé (API partners). Requis seulement si le dossier
 * n'a pas encore de {@code clientId} — une étude validée n'est plus modifiable via PUT.
 */
@Data
public class GenererDevisDto {

    @Size(max = 100)
    private String clientId;
}
