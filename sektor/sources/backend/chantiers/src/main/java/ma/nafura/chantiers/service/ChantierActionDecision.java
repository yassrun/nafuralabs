package ma.nafura.chantiers.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import ma.nafura.chantiers.api.dto.CockpitChantierDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.platform.framework.context.UserContext;

/** Décision unique des actions cockpit/portefeuille, basée sur statut, readiness et permissions. */
public final class ChantierActionDecision {

    private static final Map<String, String> PERMISSION_EFFECTIVE = Map.of(
            "chantiers.read", "chantiers.chantiers.chantier.read",
            "chantiers.update", "chantiers.chantiers.chantier.update",
            "chantiers.budget.read", "chantiers.chantiers.chantier.budget.read");

    private static final Set<String> ROLES_AVANCEMENT = Set.of(
            "BTP_CHEF_CHANTIER", "BTP_CONDUCTEUR_TRAVAUX", "BTP_DIRECTEUR_TRAVAUX", "BTP_DG");
    private static final Set<String> ROLES_DA_ST = Set.of(
            "BTP_CONDUCTEUR_TRAVAUX", "BTP_DIRECTEUR_TRAVAUX", "BTP_DG");
    private static final Set<String> ROLES_RECEPTION = Set.of(
            "BTP_CHEF_CHANTIER", "BTP_MAGASINIER", "BTP_CONDUCTEUR_TRAVAUX",
            "BTP_DIRECTEUR_TRAVAUX", "BTP_DG");
    private static final Set<String> ROLES_DOCUMENTS = Set.of(
            "BTP_CHEF_CHANTIER", "BTP_CONDUCTEUR_TRAVAUX", "BTP_DIRECTEUR_TRAVAUX", "BTP_DG");
    private static final Set<String> ROLES_MOIS = Set.of(
            "BTP_CONDUCTEUR_TRAVAUX", "BTP_DIRECTEUR_TRAVAUX", "BTP_DG");
    private static final Set<String> ROLES_FINANCE = Set.of(
            "BTP_DAF", "BTP_DG", "BTP_DIRECTEUR_TRAVAUX");
    private static final Set<String> ROLES_MARCHE = Set.of(
            "BTP_CONDUCTEUR_TRAVAUX", "BTP_DIRECTEUR_TRAVAUX", "BTP_DG");

    private ChantierActionDecision() {}

    public static List<CockpitChantierDto.NextActionDto> actions(
            Chantier chantier, long nbLots, boolean aConducteur, boolean aChefChantier) {
        return actionsBrutes(chantier, nbLots, aConducteur, aChefChantier).stream()
                .filter(a -> autorise(a.getPermission(), rolesPour(a.getLibelle())))
                .toList();
    }

    public static CockpitChantierDto.NextActionDto premiereAction(
            Chantier chantier, long nbLots, boolean aConducteur, boolean aChefChantier) {
        return actions(chantier, nbLots, aConducteur, aChefChantier).stream()
                .findFirst().orElse(null);
    }

    private static List<CockpitChantierDto.NextActionDto> actionsBrutes(
            Chantier c, long nbLots, boolean aConducteur, boolean aChefChantier) {
        String id = c.getId();
        List<CockpitChantierDto.NextActionDto> out = new ArrayList<>();
        if (Chantier.STATUS_EN_PREPARATION.equals(c.getStatus())) {
            boolean pret = PreparationRegles.bloquants(c, nbLots, aConducteur, aChefChantier).isEmpty();
            out.add(action(1,
                    pret ? "chantiers.cockpit.action.demarrer" : "chantiers.cockpit.action.preparer",
                    "/chantiers/{id}", "chantiers.update", id));
            out.add(action(2, "chantiers.cockpit.action.equipe", "/chantiers/{id}?tab=equipe", "chantiers.update", id));
            out.add(action(3, "chantiers.cockpit.action.budget", "/chantiers/budget/{id}", "chantiers.budget.read", id));
            out.add(action(4, "chantiers.cockpit.action.planning", "/chantiers/planning?chantier={id}", "chantiers.read", id));
            return out;
        }
        if (Chantier.STATUS_SUSPENDU.equals(c.getStatus())) {
            out.add(action(1, "chantiers.cockpit.action.reprendre", "/chantiers/{id}", "chantiers.update", id));
            out.add(action(2, "chantiers.cockpit.action.budget", "/chantiers/budget/{id}", "chantiers.budget.read", id));
            out.add(action(3, "chantiers.cockpit.action.planning", "/chantiers/planning?chantier={id}", "chantiers.read", id));
            return out;
        }
        if (Chantier.STATUS_EN_COURS.equals(c.getStatus())) {
            out.add(action(1, "chantiers.cockpit.action.avancement",
                    "/chantiers/avancements/saisie/{id}", "chantiers.update", id));
            out.add(action(2, "chantiers.cockpit.action.receptionBl",
                    "/achats/commandes?chantierId={id}", "chantiers.read", id));
            out.add(action(3, "chantiers.cockpit.action.demandeAchat",
                    "/achats/demandes/new?chantierId={id}", "chantiers.update", id));
            out.add(action(4, "chantiers.cockpit.action.documents",
                    "/chantiers/documents?chantierId={id}", "chantiers.read", id));
            out.add(action(5, "chantiers.cockpit.action.sousTraitance",
                    "/chantiers/sous-traitance/new?chantierId={id}", "chantiers.update", id));
            out.add(action(6, "chantiers.cockpit.action.attachement",
                    "/chantiers/attachements/saisie?chantierId={id}", "chantiers.update", id));
            out.add(action(7, "chantiers.cockpit.action.situation",
                    "/chantiers/situations?chantierId={id}", "chantiers.update", id));
            out.add(action(8, "chantiers.cockpit.action.budget",
                    "/chantiers/budget/{id}", "chantiers.budget.read", id));
            if (!Chantier.SOURCE_MARCHE.equals(c.getSourceVente())) {
                out.add(action(9, "chantiers.cockpit.action.notifierMarche",
                        "/marches/contrats/new?chantierId={id}", "chantiers.update", id));
            }
            return out;
        }
        out.add(action(1, "chantiers.cockpit.action.budget", "/chantiers/budget/{id}", "chantiers.budget.read", id));
        out.add(action(2, "chantiers.cockpit.action.situations", "/chantiers/situations?chantierId={id}", "chantiers.read", id));
        out.add(action(3, "chantiers.cockpit.action.documents", "/chantiers/documents?chantierId={id}", "chantiers.read", id));
        return out;
    }

    private static Set<String> rolesPour(String libelle) {
        if (libelle == null) return Set.of();
        return switch (libelle) {
            case "chantiers.cockpit.action.avancement" -> ROLES_AVANCEMENT;
            case "chantiers.cockpit.action.demandeAchat",
                    "chantiers.cockpit.action.sousTraitance" -> ROLES_DA_ST;
            case "chantiers.cockpit.action.receptionBl" -> ROLES_RECEPTION;
            case "chantiers.cockpit.action.documents" -> ROLES_DOCUMENTS;
            case "chantiers.cockpit.action.attachement",
                    "chantiers.cockpit.action.situation" -> ROLES_MOIS;
            case "chantiers.cockpit.action.budget" -> ROLES_FINANCE;
            case "chantiers.cockpit.action.notifierMarche" -> ROLES_MARCHE;
            default -> Set.of();
        };
    }

    private static boolean autorise(String permission, Set<String> rolesAutorises) {
        if (!permissionOk(permission)) return false;
        if (rolesAutorises == null || rolesAutorises.isEmpty()) return true;
        if (UserContext.isOwnerOrSuperAdmin()) return true;
        String role = UserContext.getUserRole();
        if (role == null || role.isBlank()) return true;
        return rolesAutorises.contains(role);
    }

    private static boolean permissionOk(String permission) {
        if (permission == null) return true;
        if (!UserContext.getPermissions().isEmpty()) {
            String effective = PERMISSION_EFFECTIVE.getOrDefault(permission, permission);
            return UserContext.hasPermission(effective) || UserContext.hasPermission(permission);
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
            int priorite, String libelle, String route, String permission, String chantierId) {
        String resolved = chantierId == null ? route : route.replace("{id}", chantierId);
        return CockpitChantierDto.NextActionDto.builder()
                .priorite(priorite).libelle(libelle).route(resolved).permission(permission).build();
    }
}
