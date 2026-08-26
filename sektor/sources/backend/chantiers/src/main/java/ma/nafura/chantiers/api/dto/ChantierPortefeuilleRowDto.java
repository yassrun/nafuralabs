package ma.nafura.chantiers.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ligne de portefeuille chantier (cockpit-chantier AC-18) — les mêmes faits que le cockpit,
 * projetés dans la liste pour décider où agir. Les montants absents (vente, budget, marge)
 * sont {@code null} (jamais zéro) ; les colonnes financières d'un rôle non autorisé sont
 * absentes du DTO (AC-4/AC-20, fermé en SEKTOR-200).
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChantierPortefeuilleRowDto {

    private String id;
    private String code;
    private String nom;
    private String client;
    private String status;
    private String responsable;

    private BigDecimal avancementPercent;
    /** Jours restants avant échéance (positif) ou jours de retard (négatif) — null si dates absentes. */
    private Integer joursRestantsOuRetard;
    private boolean enRetard;

    private BigDecimal montantVenteActifHt;
    private BigDecimal budgetReviseHt;
    private BigDecimal margeProjeteeHt;
    private BigDecimal margeProjeteePct;

    private String alerteCode;
    private String alerteSeverite;
    private CockpitChantierDto.NextActionDto prochaineAction;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Page {
        private List<ChantierPortefeuilleRowDto> items;
        private long total;
        private int page;
        private int size;
        /** P0-4 — le rôle courant voit-il les montants financiers ? (false = colonnes absentes). */
        private boolean financeAutorisee;
    }
}
