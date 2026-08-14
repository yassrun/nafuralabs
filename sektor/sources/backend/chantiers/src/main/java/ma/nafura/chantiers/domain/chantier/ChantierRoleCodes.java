package ma.nafura.chantiers.domain.chantier;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Canonical BTP role codes and their scope family (chantier vs entreprise).
 * Affectations use chantier-scoped (or BOTH) roles only.
 */
public final class ChantierRoleCodes {

    public static final String SCOPE_CHANTIER = "CHANTIER";
    public static final String SCOPE_ENTREPRISE = "ENTREPRISE";
    public static final String SCOPE_BOTH = "BOTH";

    public static final String BTP_DG = "BTP_DG";
    public static final String BTP_DAF = "BTP_DAF";
    public static final String BTP_DIRECTEUR_TRAVAUX = "BTP_DIRECTEUR_TRAVAUX";
    public static final String BTP_CONDUCTEUR_TRAVAUX = "BTP_CONDUCTEUR_TRAVAUX";
    public static final String BTP_CHEF_CHANTIER = "BTP_CHEF_CHANTIER";
    public static final String BTP_CHEF_EQUIPE = "BTP_CHEF_EQUIPE";
    public static final String BTP_MAGASINIER = "BTP_MAGASINIER";
    public static final String BTP_POINTEUR = "BTP_POINTEUR";
    public static final String BTP_INGENIEUR = "BTP_INGENIEUR";

    /** Hierarchy for absence fallback (lowest index = lowest rank). */
    public static final String[] HIERARCHY_ASC = {
        BTP_CHEF_EQUIPE,
        BTP_CHEF_CHANTIER,
        BTP_CONDUCTEUR_TRAVAUX,
        BTP_DIRECTEUR_TRAVAUX,
        BTP_DG
    };

    private static final Map<String, String> SCOPE_BY_ROLE = Map.ofEntries(
            Map.entry(BTP_DG, SCOPE_ENTREPRISE),
            Map.entry(BTP_DAF, SCOPE_ENTREPRISE),
            Map.entry(BTP_DIRECTEUR_TRAVAUX, SCOPE_BOTH),
            Map.entry(BTP_CONDUCTEUR_TRAVAUX, SCOPE_CHANTIER),
            Map.entry(BTP_CHEF_CHANTIER, SCOPE_CHANTIER),
            Map.entry(BTP_CHEF_EQUIPE, SCOPE_CHANTIER),
            Map.entry(BTP_MAGASINIER, SCOPE_BOTH),
            Map.entry(BTP_POINTEUR, SCOPE_BOTH),
            Map.entry(BTP_INGENIEUR, SCOPE_CHANTIER),
            Map.entry("OWNER", SCOPE_ENTREPRISE),
            Map.entry("ADMIN", SCOPE_ENTREPRISE),
            Map.entry("MANAGER", SCOPE_ENTREPRISE),
            Map.entry("MEMBER", SCOPE_ENTREPRISE),
            Map.entry("VIEWER", SCOPE_ENTREPRISE),
            Map.entry("SUPER_ADMIN", SCOPE_ENTREPRISE)
    );

    private static final Set<String> AFFECTABLE = Set.of(
            BTP_DIRECTEUR_TRAVAUX,
            BTP_CONDUCTEUR_TRAVAUX,
            BTP_CHEF_CHANTIER,
            BTP_CHEF_EQUIPE,
            BTP_MAGASINIER,
            BTP_POINTEUR,
            BTP_INGENIEUR
    );

    /** Maps legacy / workflow role refs to canonical BTP_* codes. */
    private static final Map<String, String> ALIASES = Map.ofEntries(
            Map.entry("CONDUCTEUR_TRAVAUX", BTP_CONDUCTEUR_TRAVAUX),
            Map.entry("CHEF_CHANTIER", BTP_CHEF_CHANTIER),
            Map.entry("CHEF_EQUIPE", BTP_CHEF_EQUIPE),
            Map.entry("DIRECTEUR_TRAVAUX", BTP_DIRECTEUR_TRAVAUX),
            Map.entry("DIR_TRAVAUX", BTP_DIRECTEUR_TRAVAUX),
            Map.entry("MAGASINIER", BTP_MAGASINIER),
            Map.entry("POINTEUR", BTP_POINTEUR),
            Map.entry("INGENIEUR", BTP_INGENIEUR),
            Map.entry("DG", BTP_DG),
            Map.entry("DAF", BTP_DAF),
            Map.entry("COMITE", BTP_DG)
    );

    private ChantierRoleCodes() {
    }

    public static String normalize(String roleCode) {
        if (roleCode == null || roleCode.isBlank()) {
            return null;
        }
        String upper = roleCode.trim().toUpperCase(Locale.ROOT);
        return ALIASES.getOrDefault(upper, upper);
    }

    public static String scopeType(String roleCode) {
        String normalized = normalize(roleCode);
        if (normalized == null) {
            return SCOPE_ENTREPRISE;
        }
        return SCOPE_BY_ROLE.getOrDefault(normalized, SCOPE_ENTREPRISE);
    }

    public static boolean isAffectable(String roleCode) {
        String normalized = normalize(roleCode);
        return normalized != null && AFFECTABLE.contains(normalized);
    }

    public static boolean isEntrepriseScope(String roleCode) {
        String scope = scopeType(roleCode);
        return SCOPE_ENTREPRISE.equals(scope) || SCOPE_BOTH.equals(scope);
    }

    public static boolean isChantierScoped(String roleCode) {
        String scope = scopeType(roleCode);
        return SCOPE_CHANTIER.equals(scope) || SCOPE_BOTH.equals(scope);
    }

    public static String label(String roleCode) {
        String normalized = normalize(roleCode);
        if (normalized == null) {
            return roleCode;
        }
        return switch (normalized) {
            case BTP_DG -> "Direction générale";
            case BTP_DAF -> "DAF";
            case BTP_DIRECTEUR_TRAVAUX -> "Directeur travaux";
            case BTP_CONDUCTEUR_TRAVAUX -> "Conducteur de travaux";
            case BTP_CHEF_CHANTIER -> "Chef de chantier";
            case BTP_CHEF_EQUIPE -> "Chef d'équipe";
            case BTP_MAGASINIER -> "Magasinier";
            case BTP_POINTEUR -> "Pointeur";
            case BTP_INGENIEUR -> "Ingénieur";
            default -> normalized;
        };
    }

    public static String nextHigherRole(String roleCode) {
        String normalized = normalize(roleCode);
        if (normalized == null) {
            return null;
        }
        for (int i = 0; i < HIERARCHY_ASC.length - 1; i++) {
            if (HIERARCHY_ASC[i].equals(normalized)) {
                return HIERARCHY_ASC[i + 1];
            }
        }
        return null;
    }

    public static Set<String> affectableRoles() {
        return AFFECTABLE;
    }
}
