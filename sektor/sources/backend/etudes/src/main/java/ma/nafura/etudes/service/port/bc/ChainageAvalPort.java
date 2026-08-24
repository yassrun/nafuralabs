package ma.nafura.etudes.service.port.bc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Port L13 — création du chantier et de son arbre hors module etudes.
 * Implémenté dans {@code backend/app} ; NoOp pour tests module.
 *
 * <p><b>Aucun marché ici</b> (AC-10) : le marché naît à la notification, pas à la conversion.
 * Le port ne crée que le chantier et son arbre.
 *
 * <p><b>Plus aucun budget agrégé au chantier</b> (budget-et-marge AC-1, AC-8) : le déboursé
 * décomposé voyage <b>avec le nœud</b>, dans {@link LotProjection#debourse()}. Il n'y a plus de
 * total par rubrique au niveau chantier — ni dans ce port, ni derrière lui : un agrégat calculé
 * une fois puis stocké est exactement ce qui faisait perdre la décomposition en route.
 */
public interface ChainageAvalPort {

    ConversionResult convert(ConversionCommand command);

    record ConversionCommand(
            UUID dossierId,
            String clientId,
            String clientName,
            String objet,
            String chantierLabel,
            String chantierCode,
            String chantierVille,
            LocalDate dateDemarrage,
            Integer dureeMois,
            /** Référence de vente portée par le chantier — pas un contrat de marché (AC-10). */
            String marcheReference,
            BigDecimal montantHt,
            BigDecimal tauxTva,
            List<LotProjection> lots) {}

    /**
     * Un nœud du DPGF projeté vers l'aval.
     *
     * @param dpgfNoeudId identifiant du nœud d'origine — le lien retour que la ligne vendue du
     *     chantier conserve (AC-2). {@code null} seulement pour un lot d'accueil créé par
     *     l'humain au moment de la conversion (AC-12) : celui-ci n'est pas vendu, il est interne.
     * @param debourse déboursé décomposé du poste (budget-et-marge AC-1 à AC-4). Renseigné pour
     *     les articles seulement : un lot vaut la somme de ses enfants et ne porte pas de
     *     déboursé propre. {@code null} sur un lot, un sous-lot ou un lot d'accueil.
     */
    record LotProjection(
            UUID dpgfNoeudId,
            String code,
            String designation,
            String type,
            String parentCode,
            String unite,
            BigDecimal quantite,
            BigDecimal prixUnitaireHt,
            BigDecimal montantHt,
            int ordre,
            DebourseProjection debourse) {}

    /**
     * Le déboursé d'un poste, décomposé, tel que l'étude le connaît au moment de la conversion.
     *
     * <p>C'est un <b>déboursé</b>, jamais un prix de vente ni un coût de revient : frais généraux
     * et marge n'entrent pas dans le budget (AC-2).
     *
     * <p>La date de la copie n'est pas ici : elle est posée par l'aval au moment où il écrit,
     * pour qu'elle date l'écriture et non la lecture (AC-5).
     *
     * @param origine {@code DECOMPOSE}, {@code FORFAIT} ou {@code ESTIME} — d'où vient le coût
     * @param nonFiable le coût a été déduit d'un prix de vente ({@code coutDeduit}) : signalé à
     *     l'écran, ni corrigé ni caché (AC-3)
     * @param prixDpuId le {@code PrixDpu} d'où vient la décomposition, {@code null} sans DPU
     * @param prixDpuVersion sa version à l'instant de la lecture — de quoi prouver après coup
     *     que le budget ne suit plus l'étude (AC-5)
     * @param parts une part par rubrique effectivement dotée ; leur somme est le déboursé du
     *     poste, égale à {@code coût unitaire × quantité} au centime près (AC-4)
     */
    record DebourseProjection(
            String origine,
            boolean nonFiable,
            UUID prixDpuId,
            Long prixDpuVersion,
            List<PartRubrique> parts) {}

    /**
     * Une part du déboursé d'un poste.
     *
     * @param rubrique {@code MATIERE}, {@code MAIN_DOEUVRE}, {@code MATERIEL},
     *     {@code SOUS_TRAITANCE} — les quatre types de {@code ComposantDpu} sous leurs noms
     *     d'origine — ou {@code NON_VENTILE} pour la part que la décomposition ne couvre pas
     */
    record PartRubrique(String rubrique, BigDecimal montantHt) {}

    /** AC-10 — la conversion ne rend qu'un chantier. Aucun marché n'existe après elle. */
    record ConversionResult(String chantierId) {}
}
