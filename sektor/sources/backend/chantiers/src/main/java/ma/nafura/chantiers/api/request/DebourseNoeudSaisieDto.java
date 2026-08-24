package ma.nafura.chantiers.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

/**
 * Saisie ou révision du déboursé d'un nœud, rubrique par rubrique (AC-6, AC-7).
 *
 * <p>Une seule forme pour les deux gestes : ce qui change est l'endroit où le montant atterrit,
 * et c'est le service qui le décide selon la nature du nœud — pas l'appelant.
 */
@Data
public class DebourseNoeudSaisieDto {

    @NotEmpty
    @Valid
    private List<LigneDto> rubriques;

    @Data
    public static class LigneDto {
        /** MATIERE | MAIN_DOEUVRE | MATERIEL | SOUS_TRAITANCE. */
        @NotBlank
        private String rubrique;

        /** Absent ou nul : la rubrique vaut zéro. Jamais négatif. */
        private BigDecimal montantHt;
    }
}
