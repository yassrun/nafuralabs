package ma.nafura.chantiers.service;

import java.util.Set;
import ma.nafura.platform.framework.context.UserContext;

/**
 * P0-4 — autorisation financière unique, partagée par le cockpit et le portefeuille.
 *
 * <p>Vérifie la permission effective {@code chantiers.chantiers.portefeuille.finance.read}
 * quand le contexte porte des permissions ; sinon (lectures legacy/tests) retombe sur la
 * matrice de rôle du contrat cockpit (AC-20) — owner, BTP_DG, BTP_DAF, BTP_DIRECTEUR_TRAVAUX.
 * Une donnée non autorisée est absente de la réponse (jamais zéro, jamais masquée côté UI).
 */
public final class ChantierFinanceAccess {

    public static final String PERMISSION_FINANCE_READ = "chantiers.chantiers.portefeuille.finance.read";

    private ChantierFinanceAccess() {}

    public static boolean peutVoirFinance() {
        if (UserContext.isOwnerOrSuperAdmin()) {
            return true;
        }
        Set<String> permissions = UserContext.getPermissions();
        if (permissions != null && !permissions.isEmpty()) {
            return UserContext.hasPermission(PERMISSION_FINANCE_READ);
        }
        String role = UserContext.getUserRole();
        if (role == null) return false;
        return switch (role) {
            case "BTP_DG", "BTP_DAF", "BTP_DIRECTEUR_TRAVAUX" -> true;
            default -> false;
        };
    }
}
