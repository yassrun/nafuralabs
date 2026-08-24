package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

/**
 * Imputation d'un coût réel (AC-10).
 *
 * <p>Un nœud, une rubrique, un montant, une date. <b>Aucune activité, aucune zone, aucune
 * quotité</b> — ce DTO n'en a pas de champ, même optionnel : un champ optionnel finit toujours
 * par être demandé à l'écran.
 */
@Data
public class CoutReelCreateDto {

    /**
     * Le nœud imputé. Peut être absent : le coût tombe alors sur le nœud interne « Frais de
     * chantier », d'où il reste ré-imputable (AC-11).
     */
    private String posteId;

    /** MATIERE | MAIN_DOEUVRE | MATERIEL | SOUS_TRAITANCE. */
    @NotBlank
    private String rubrique;

    @NotNull
    private BigDecimal montantHt;

    /** Absente : la date du jour. */
    private LocalDate dateCout;

    private String libelle;

    /** Pointage, facture, sortie de magasin, saisie… Traçabilité, pas règle métier. */
    private String source;
}
