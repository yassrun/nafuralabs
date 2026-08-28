package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

/**
 * Read model cockpit (cockpit-chantier AC-1 à AC-13, AC-22) — instantané de lecture composé par
 * le BC Chantiers, jamais une nouvelle vérité stockée.
 *
 * <p>Chaque métrique financière porte montant, devise, base HT/TTC, date de fraîcheur et état
 * {@code AVAILABLE | NOT_AVAILABLE | FORBIDDEN}. Le frontend ne recalcule ni marge, ni retard,
 * ni permission : il consomme l'ordre et les états produits ici.
 */
@Data
@Builder
public class CockpitChantierDto {

    private IdentityDto identity;
    private ScheduleDto schedule;
    private FinanceDto finance;
    private ProgressDto progress;
    private List<PreparationDto> preparation;
    private List<AlerteDto> alerts;
    private List<NextActionDto> nextActions;
    private List<ActivityFeedDto> activityFeed;
    /** P1-13 — sources secondaires indisponibles (section + cause), jamais de faux zéro. */
    private List<DegradationDto> degradations;
    /** SEKTOR-227 — compteurs ops quotidiennes (DA…) pour les tuiles EN_COURS. */
    private OpsDto ops;

    @Data
    @Builder
    public static class IdentityDto {
        private String chantierId;
        private String code;
        private String nom;
        private String client;
        private String status;
        private String sourceVente;
        private String devisNumero;
        private OffsetDateTime fraicheur;
    }

    @Data
    @Builder
    public static class ScheduleDto {
        private LocalDate dateDemarrage;
        private LocalDate dateFinPrevue;
        private LocalDate dateFinReelle;
        private String osReference;
        private LocalDate osDateEffet;
        /** Jours restants avant échéance, ou jours de retard (positif) — null si dates absentes. */
        private Integer joursRestantsOuRetard;
        /** true = en retard (aujourd'hui > fin prévue). */
        private boolean enRetard;
        /** Donnée manquante empêchant le calcul — null si le calcul est possible. */
        private String absence;
    }

    @Data
    @Builder
    public static class FinanceDto {
        private MontantDto montantVenteActifHt;
        private MontantDto debourseInitialHt;
        private MontantDto budgetReviseHt;
        private MontantDto margeProjeteeHt;
        private MontantDto margeProjeteePct;
    }

    @Data
    @Builder
    public static class MontantDto {
        private BigDecimal montant;
        private String devise;
        private String base;
        /** Source du fait (DEVIS, SNAPSHOT, ARBRE, VENTE-BUDGET…) — AC-3. */
        private String source;
        private OffsetDateTime fraicheur;
        private String etat;
        private String cause;
    }

    @Data
    @Builder
    public static class ProgressDto {
        private MontantDto avancementPercent;
        private MontantDto factureHt;
        private MontantDto encaisseTtc;
        private FluxMensuelDto fluxMois;
    }

    @Data
    @Builder
    public static class FluxMensuelDto {
        private String etape;
        private String periode;
        private String premiereAction;
        private boolean actionnable;
    }

    @Data
    @Builder
    public static class PreparationDto {
        private String code;
        private String etat;
        private String libelle;
        private String action;
        private String raison;
    }

    /** AC-9 — l'alerte porte date, valeur observée, règle/seuil et identifiant source. */
    @Data
    @Builder
    public static class AlerteDto {
        private String code;
        private String severite;
        private String faitSource;
        private String message;
        private String action;
        /** Date du fait source (pas la date de lecture). */
        private LocalDate dateFait;
        /** Valeur observée à l'origine de l'alerte (montant, taux, jours…). */
        private BigDecimal valeurObservee;
        /** Règle/seuil déclencheur (ex. « marge < 0 »). */
        private String regle;
        /** Identifiant de la donnée source (nœud, lot, document…). */
        private String sourceId;
    }

    /** P1-13 — une source secondaire en panne : section + cause, le reste reste utilisable. */
    @Data
    @Builder
    public static class DegradationDto {
        private String section;
        private String cause;
    }

    /** SEKTOR-227 — résumé ops (tuile DA…) : valeur ou NOT_AVAILABLE, jamais un faux zéro. */
    @Data
    @Builder
    public static class OpsDto {
        private CompteurDto demandesAchat;
    }

    @Data
    @Builder
    public static class CompteurDto {
        private Long valeur;
        private String etat;
        private String cause;
    }

    @Data
    @Builder
    public static class NextActionDto {
        private int priorite;
        private String libelle;
        private String route;
        private String permission;
    }

    @Data
    @Builder
    public static class ActivityFeedDto {
        private OffsetDateTime date;
        private String type;
        private String auteur;
        private String contenu;
    }
}
