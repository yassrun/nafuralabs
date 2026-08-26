package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Data;
import ma.nafura.chantiers.domain.budget.OrigineDebourse;
import ma.nafura.chantiers.domain.chantier.NatureLigne;

/**
 * Le budget d'un chantier lu sur son arbre : un nœud, ses enfants, et les mêmes chiffres à
 * chaque étage (AC-9, AC-12, AC-13).
 *
 * <p><b>Vocabulaire (AC-15).</b> Les noms exposés ici sont ceux du chantier : déboursé (prévu /
 * révisé / réel), marge, écart, avancement. {@code debourseFaitHt} est le déboursé prévu de ce
 * qui est fait — le nom interne d'un calcul n'est pas son libellé, et le libellé ne sort pas
 * d'ici.
 */
@Data
@Builder
public class BudgetArbreDto {

    private String chantierId;
    private String code;
    private String name;
    private String client;

    /** Statut métier réel du chantier — identique sur toutes les lectures (AC-14). */
    private String status;

    /** Les lots racines. Chaque nœud porte ses enfants, jusqu'aux postes. */
    private List<NoeudDto> lots;

    /** Le chantier : la somme de ses lots, par la même règle qu'à tous les étages. */
    private TotauxDto totaux;

    /** Lecture par rubrique, <b>calculée</b> depuis l'arbre — plus jamais stockée (AC-8). */
    private List<RubriqueTotalDto> rubriques;

    @Data
    @Builder
    public static class NoeudDto {
        private String id;
        private String type;
        private String code;
        private String designation;
        private NatureLigne nature;

        /** Renseignés sur un poste seulement ; un lot n'a pas de déboursé propre (AC-1). */
        private OrigineDebourse origine;

        /** Déboursé issu d'une déduction : signalé, ni corrigé ni caché (AC-3). */
        private boolean nonFiable;

        private String unite;
        private BigDecimal quantitePrevue;
        private BigDecimal quantiteFaite;

        private TotauxDto totaux;
        private List<RubriqueTotalDto> rubriques;
        private List<NoeudDto> enfants;
    }

    /** Les mêmes chiffres au poste, au lot et au chantier — une seule règle de remontée (AC-9). */
    @Data
    @Builder
    public static class TotauxDto {
        /** Ce que le client paie. Nul sur un nœud interne (AC-12). */
        private BigDecimal venduHt;

        private BigDecimal deboursePrevuHt;
        private BigDecimal debourseReviseHt;
        private BigDecimal debourseReelHt;

        /** Vendu − déboursé prévu, en valeur et en pourcentage du vendu (AC-12). */
        private BigDecimal margePrevueHt;

        private BigDecimal margePrevuePercent;

        /** Vendu − déboursé réel (AC-12). */
        private BigDecimal margeReelleHt;

        private BigDecimal margeReellePercent;

        /** Quantité faite / quantité prévue, remontée au prorata du déboursé prévu (AC-13). */
        private BigDecimal avancementPercent;

        /** Déboursé prévu de ce qui est fait : avancement × déboursé prévu (AC-13). */
        private BigDecimal debourseFaitHt;

        /** Déboursé fait − déboursé réel. Négatif = on dépense plus que ce qu'on a produit. */
        private BigDecimal ecartHt;
    }

    @Data
    @Builder
    public static class RubriqueTotalDto {
        private String rubrique;
        /** Matière, main d'œuvre, matériel, sous-traitance — dits en clair (AC-15). */
        private String label;

        private BigDecimal prevuHt;
        private BigDecimal reviseHt;
        private BigDecimal reelHt;
        private BigDecimal ecartHt;
    }
}
