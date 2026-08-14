package ma.nafura.etudes.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class CapitalisationVerserDto {

    @NotEmpty
    @Valid
    private List<Selection> selections;

    @Data
    public static class Selection {
        @NotNull
        private UUID noeudId;

        /**
         * CREER (défaut si nouveau) | IGNORER | NOUVEAU_CODE | REMPLACER.
         * Collision sans décision explicite → refus.
         */
        private String decision;

        /** Obligatoire si decision = NOUVEAU_CODE. */
        private String codeOverride;
    }
}
