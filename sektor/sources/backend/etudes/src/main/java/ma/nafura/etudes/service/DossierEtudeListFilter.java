package ma.nafura.etudes.service;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import org.springframework.util.StringUtils;

/**
 * Filtres listing dossier — appliqués après enrichissement AO (date limite, type).
 */
public final class DossierEtudeListFilter {

    static final Set<StatutDossierEtude> CLOS_POUR_DELAI = EnumSet.of(
            StatutDossierEtude.GAGNE,
            StatutDossierEtude.PERDU,
            StatutDossierEtude.CONVERTIE,
            StatutDossierEtude.ANNULE,
            StatutDossierEtude.NE_PAS_ETUDIER);

    /** File d’attente : quelqu’un d’autre doit agir (pas le chiffrage en cours). */
    static final Set<StatutDossierEtude> EN_ATTENTE = EnumSet.of(
            StatutDossierEtude.A_DECIDER,
            StatutDossierEtude.AFFECTE,
            StatutDossierEtude.EN_VALIDATION,
            StatutDossierEtude.A_AVIS_EXECUTION,
            StatutDossierEtude.REJETE_CHIFFRAGE);

    private DossierEtudeListFilter() {}

    public static boolean matches(
            DossierEtude dossier,
            StatutDossierEtude status,
            String clientId,
            String chargeEtudeUserId,
            String affectation,
            String delaiDepot,
            String aoType,
            String search,
            String attente,
            String currentUserId,
            String currentUserEmail,
            LocalDate today) {
        if (dossier == null) {
            return false;
        }
        if (status != null && dossier.getStatus() != status) {
            return false;
        }
        if (StringUtils.hasText(clientId) && !eqIgnoreCase(dossier.getClientId(), clientId)) {
            return false;
        }
        if (StringUtils.hasText(chargeEtudeUserId)
                && !eqIgnoreCase(dossier.getChargeEtudeUserId(), chargeEtudeUserId)) {
            return false;
        }
        if (!matchAffectation(dossier, affectation, currentUserId, currentUserEmail)) {
            return false;
        }
        if (!matchDelai(dossier, delaiDepot, today)) {
            return false;
        }
        if (StringUtils.hasText(aoType) && !eqIgnoreCase(dossier.getAoType(), aoType)) {
            return false;
        }
        if (!matchAttente(dossier, attente)) {
            return false;
        }
        return matchSearch(dossier, search);
    }

    static boolean estOuvertPourDelai(StatutDossierEtude status) {
        return status != null && !CLOS_POUR_DELAI.contains(status);
    }

    private static boolean matchAffectation(
            DossierEtude dossier, String affectation, String currentUserId, String currentUserEmail) {
        if (!StringUtils.hasText(affectation)) {
            return true;
        }
        String key = affectation.trim().toUpperCase(Locale.ROOT);
        return switch (key) {
            case "MOI" -> estAssigneA(dossier, currentUserId, currentUserEmail);
            case "NON_AFFECTE" -> !StringUtils.hasText(dossier.getChargeEtudeUserId());
            default -> true;
        };
    }

    /** Chargé d’étude ou ingénieur à qui un lot est délégué. */
    static boolean estAssigneA(DossierEtude dossier, String currentUserId, String currentUserEmail) {
        if (eqIgnoreCase(dossier.getChargeEtudeUserId(), currentUserId)
                || eqIgnoreCase(dossier.getChargeEtudeUserId(), currentUserEmail)) {
            return true;
        }
        var lots = dossier.getLotChargeUserIds();
        if (lots == null || lots.isEmpty()) {
            return false;
        }
        for (String id : lots) {
            if (eqIgnoreCase(id, currentUserId) || eqIgnoreCase(id, currentUserEmail)) {
                return true;
            }
        }
        return false;
    }

    private static boolean matchDelai(DossierEtude dossier, String delaiDepot, LocalDate today) {
        if (!StringUtils.hasText(delaiDepot)) {
            return true;
        }
        LocalDate limite = dossier.getAoDateLimiteDepot();
        String key = delaiDepot.trim().toUpperCase(Locale.ROOT);
        return switch (key) {
            case "EN_RETARD" -> limite != null
                    && today != null
                    && limite.isBefore(today)
                    && estOuvertPourDelai(dossier.getStatus());
            case "J7" -> limite != null
                    && today != null
                    && !limite.isBefore(today)
                    && !limite.isAfter(today.plusDays(7))
                    && estOuvertPourDelai(dossier.getStatus());
            case "CE_MOIS" -> limite != null
                    && today != null
                    && limite.getYear() == today.getYear()
                    && limite.getMonth() == today.getMonth()
                    && estOuvertPourDelai(dossier.getStatus());
            case "SANS_DATE" -> limite == null;
            default -> true;
        };
    }

    private static boolean matchAttente(DossierEtude dossier, String attente) {
        if (!StringUtils.hasText(attente)) {
            return true;
        }
        String key = attente.trim().toUpperCase(Locale.ROOT);
        if ("OUI".equals(key) || "ATTENTE".equals(key)) {
            return dossier.getStatus() != null && EN_ATTENTE.contains(dossier.getStatus());
        }
        return true;
    }

    private static boolean matchSearch(DossierEtude dossier, String search) {
        if (!StringUtils.hasText(search)) {
            return true;
        }
        String q = search.trim().toLowerCase(Locale.ROOT);
        return contains(dossier.getNumero(), q)
                || contains(dossier.getObjet(), q)
                || contains(dossier.getClientNom(), q)
                || contains(dossier.getChargeEtudeNom(), q)
                || contains(dossier.getAoReference(), q);
    }

    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(q);
    }

    private static boolean eqIgnoreCase(String a, String b) {
        return StringUtils.hasText(a)
                && StringUtils.hasText(b)
                && a.trim().equalsIgnoreCase(b.trim());
    }
}
