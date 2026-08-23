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
 * Le port ne crée que le chantier, son arbre et son budget prévisionnel.
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
            List<LotProjection> lots,
            List<BudgetRubrique> budget) {}

    /**
     * Un nœud du DPGF projeté vers l'aval.
     *
     * @param dpgfNoeudId identifiant du nœud d'origine — le lien retour que la ligne vendue du
     *     chantier conserve (AC-2). {@code null} seulement pour un lot d'accueil créé par
     *     l'humain au moment de la conversion (AC-12) : celui-ci n'est pas vendu, il est interne.
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
            int ordre) {}

    record BudgetRubrique(
            String rubrique, String label, BigDecimal previsionnelHt, boolean nonFiable, String sourceOrigine) {}

    /** AC-10 — la conversion ne rend qu'un chantier. Aucun marché n'existe après elle. */
    record ConversionResult(String chantierId) {}
}
