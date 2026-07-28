package ma.nafura.sektor.ai;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import ma.nafura.platform.ai.agent.service.navigation.NavigationRegistry;
import ma.nafura.platform.ai.agent.service.navigation.NavigationTarget;
import org.springframework.stereotype.Component;

@Component
public class SektorNavigationRegistry implements NavigationRegistry {

    @Override
    public List<NavigationTarget> all() {
        return List.of(
                target(List.of("chantier", "chantiers", "projets", "project"), "/chantiers", "Chantiers", "chantier.chantier.read", "chantier"),
                target(List.of("situation", "situations"), "/chantiers/situations", "Situations", "chantier.situation.read", "situation"),
                target(List.of("achat", "achats", "purchase"), "/achats", "Achats", "achat.achat.read", null),
                target(List.of("stock", "inventaire", "inventory", "article", "articles"), "/inventory/stock", "Stock", "inventory.stock.read", "stock"),
                target(List.of("finance", "comptabilité", "comptabilite"), "/finance", "Finance", "finance.finance.read", null),
                target(List.of("facture", "factures", "invoice"), "/finance/invoices", "Factures", "finance.invoice.read", "invoice"),
                target(List.of("partner", "partners", "fournisseur", "client"), "/directory/partners", "Partners", "partner.partner.read", "partner"),
                target(List.of("rh", "ressources humaines"), "/rh", "RH", "rh.rh.read", null),
                target(List.of("hse"), "/hse/tableau-bord", "HSE", "hse.hse.read", null),
                target(List.of("marché", "marches", "marche"), "/marches", "Marchés", "marche.marche.read", null),
                target(List.of("pilotage"), "/pilotage", "Pilotage", "pilotage.pilotage.read", null),
                target(List.of("étude", "etudes", "etude"), "/etudes", "Études", "etude.etude.read", null)
        );
    }

    @Override
    public Optional<NavigationTarget> resolve(String target, String entityType, String entityId) {
        if (entityType != null && entityId != null) {
            String normalized = entityType.toLowerCase(Locale.ROOT);
            return all().stream()
                    .filter(t -> t.getEntityType() != null && normalized.contains(t.getEntityType()))
                    .findFirst()
                    .map(base -> NavigationTarget.builder()
                            .keywords(base.getKeywords())
                            .route(base.getRoute().replaceAll("/$", "") + "/" + entityId)
                            .label(base.getLabel())
                            .permissionKey(base.getPermissionKey())
                            .entityType(base.getEntityType())
                            .build());
        }
        if (target == null) {
            return Optional.empty();
        }
        String normalized = target.toLowerCase(Locale.ROOT);
        return all().stream()
                .filter(entry -> entry.getKeywords().stream()
                        .anyMatch(keyword -> normalized.contains(keyword.toLowerCase(Locale.ROOT))))
                .findFirst();
    }

    private NavigationTarget target(
            List<String> keywords,
            String route,
            String label,
            String permissionKey,
            String entityType
    ) {
        return NavigationTarget.builder()
                .keywords(keywords)
                .route(route)
                .label(label)
                .permissionKey(permissionKey)
                .entityType(entityType)
                .build();
    }
}
