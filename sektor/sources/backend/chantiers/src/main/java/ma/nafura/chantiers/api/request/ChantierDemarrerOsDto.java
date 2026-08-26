package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

/**
 * Demande de démarrage par ordre de service (cockpit-chantier AC-6).
 *
 * <p>Le démarrage passe uniquement par l'OS : référence et date d'effet obligatoires, commande
 * atomique {@code EN_PREPARATION → EN_COURS}, journalisée. Le planning n'est jamais exigé (AC-8).
 */
@Data
public class ChantierDemarrerOsDto {

    @NotBlank
    private String osReference;

    @NotNull
    private LocalDate osDateEffet;
}
