package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.chantiers.domain.chantier.Chantier;

/**
 * Synthèse d'une fiche chantier — dictionnaire financier canonique
 * (continuite-etude-devis-chantier AC-12, AC-13, AC-14).
 *
 * <p>Chaque montant est dérivé du snapshot commercial (AC-9/AC-10) ou de l'arbre (budget-et-marge) ;
 * jamais d'un second total stocké. Une valeur non calculable est {@code null} — l'UI affiche
 * « Non disponible » avec sa cause, jamais zéro (AC-14).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChantierSummaryDto {

    private Chantier chantier;

    private BudgetTotals budget;

    private BigDecimal avancementPercent;

    private long lotsCount;

    private long openSituationsCount;

    // ── Dictionnaire financier canonique (AC-10, AC-12) ──────────────────────

    /** Total HT de la version de devis approuvée et copiée (snapshot AC-9). */
    private BigDecimal montantVenteInitialHt;

    /** Référence de vente courante : devis approuvé tant qu'aucun marché n'est notifié (AC-11). */
    private BigDecimal montantVenteActifHt;

    /** Coût établi copié du DPU — somme des déboursés initiaux des nœuds (AC-10). */
    private BigDecimal debourseInitialHt;

    /** Dernier coût prévu du chantier — init au déboursé initial, puis somme des révisions. */
    private BigDecimal budgetReviseHt;

    /** Marge au démarrage : {@code montantVenteInitialHt - debourseInitialHt} (AC-10). */
    private BigDecimal margeInitialeHt;

    /** Taux de marge initial : {@code margeInitialeHt / montantVenteInitialHt × 100}. */
    private BigDecimal margeInitialePct;

    /** Marge selon le budget révisé : {@code montantVenteActifHt - budgetReviseHt}. */
    private BigDecimal margeProjeteeHt;

    /** Taux de marge projeté : {@code margeProjeteeHt / montantVenteActifHt × 100}. */
    private BigDecimal margeProjeteePct;

    /** Source de vente : {@code DEVIS} à la conversion, null en création directe (AC-17). */
    private String sourceVente;

    /** Statut métier réel du chantier — identique sur toutes les lectures (AC-2). */
    private String status;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BudgetTotals {

        /** Déboursé prévu (somme de l'arbre). */
        private BigDecimal prevuHt;

        /** Déboursé révisé (somme de l'arbre). */
        private BigDecimal reviseHt;

        /** Déboursé réel (somme de l'arbre). */
        private BigDecimal realiseHt;

        /** Marge historique ambiguë — conservée pour compat, remplacée par les marges canoniques. */
        private BigDecimal margeHt;
    }
}
