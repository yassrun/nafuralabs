package ma.nafura.chantiers.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import ma.nafura.chantiers.api.dto.CockpitChantierDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.platform.framework.context.UserContext;

/** Décision unique des actions cockpit/portefeuille, basée sur statut, readiness et permissions. */
public final class ChantierActionDecision {

    private static final Map<String, String> PERMISSION_EFFECTIVE = Map.of(
            "chantiers.read", "chantiers.chantiers.chantier.read",
            "chantiers.update", "chantiers.chantiers.chantier.update",
            "chantiers.budget.read", "chantiers.chantiers.chantier.budget.read");

    private ChantierActionDecision() {}

    public static List<CockpitChantierDto.NextActionDto> actions(
            Chantier chantier, long nbLots, boolean aConducteur, boolean aChefChantier) {
        return actionsBrutes(chantier, nbLots, aConducteur, aChefChantier).stream()
                .filter(a -> autorise(a.getPermission()))
                .limit(4)
                .toList();
    }

    public static CockpitChantierDto.NextActionDto premiereAction(
            Chantier chantier, long nbLots, boolean aConducteur, boolean aChefChantier) {
        return actions(chantier, nbLots, aConducteur, aChefChantier).stream()
                .findFirst().orElse(null);
    }

    private static List<CockpitChantierDto.NextActionDto> actionsBrutes(
            Chantier c, long nbLots, boolean aConducteur, boolean aChefChantier) {
        List<CockpitChantierDto.NextActionDto> out = new ArrayList<>();
        if (Chantier.STATUS_EN_PREPARATION.equals(c.getStatus())) {
            boolean pret = PreparationRegles.bloquants(c, nbLots, aConducteur, aChefChantier).isEmpty();
            out.add(action(1,
                    pret ? "chantiers.cockpit.action.demarrer" : "chantiers.cockpit.action.preparer",
                    "/chantiers/{id}", "chantiers.update"));
            out.add(action(2, "chantiers.cockpit.action.equipe", "/chantiers/{id}?tab=equipe", "chantiers.update"));
            out.add(action(3, "chantiers.cockpit.action.budget", "/chantiers/budget/{id}", "chantiers.budget.read"));
            out.add(action(4, "chantiers.cockpit.action.planning", "/chantiers/planning?chantier={id}", "chantiers.read"));
            return out;
        }
        if (Chantier.STATUS_SUSPENDU.equals(c.getStatus())) {
            out.add(action(1, "chantiers.cockpit.action.reprendre", "/chantiers/{id}", "chantiers.update"));
            out.add(action(2, "chantiers.cockpit.action.budget", "/chantiers/budget/{id}", "chantiers.budget.read"));
            out.add(action(3, "chantiers.cockpit.action.planning", "/chantiers/planning?chantier={id}", "chantiers.read"));
            return out;
        }
        if (Chantier.STATUS_EN_COURS.equals(c.getStatus())) {
            out.add(action(1, "chantiers.cockpit.action.avancement", "/chantiers/avancements/saisie/{id}", "chantiers.update"));
            out.add(action(2, "chantiers.cockpit.action.attachement", "/chantiers/attachements/saisie?chantierId={id}", "chantiers.update"));
            out.add(action(3, "chantiers.cockpit.action.situation", "/chantiers/situations?chantierId={id}", "chantiers.update"));
            out.add(action(4, "chantiers.cockpit.action.budget", "/chantiers/budget/{id}", "chantiers.budget.read"));
            return out;
        }
        out.add(action(1, "chantiers.cockpit.action.budget", "/chantiers/budget/{id}", "chantiers.budget.read"));
        out.add(action(2, "chantiers.cockpit.action.situations", "/chantiers/situations?chantierId={id}", "chantiers.read"));
        out.add(action(3, "chantiers.cockpit.action.documents", "/chantiers/documents?chantierId={id}", "chantiers.read"));
        return out;
    }

    private static boolean autorise(String permission) {
        if (permission == null) return true;
        if (!UserContext.getPermissions().isEmpty()) {
            return UserContext.hasPermission(PERMISSION_EFFECTIVE.getOrDefault(permission, permission));
        }
        if (UserContext.isOwnerOrSuperAdmin()) return true;
        String role = UserContext.getUserRole();
        if (role == null) return false;
        return switch (permission) {
            case "chantiers.update" -> List.of(
                    "BTP_DG", "BTP_DIRECTEUR_TRAVAUX", "BTP_CONDUCTEUR_TRAVAUX", "BTP_CHEF_CHANTIER").contains(role);
            case "chantiers.budget.read" -> List.of("BTP_DG", "BTP_DAF", "BTP_DIRECTEUR_TRAVAUX").contains(role);
            case "chantiers.read" -> role.startsWith("BTP_");
            default -> false;
        };
    }

    private static CockpitChantierDto.NextActionDto action(
            int priorite, String libelle, String route, String permission) {
        return CockpitChantierDto.NextActionDto.builder()
                .priorite(priorite).libelle(libelle).route(route).permission(permission).build();
    }
}
