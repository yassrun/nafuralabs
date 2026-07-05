package ma.nafura.sektor.ai;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import ma.nafura.platform.ai.agent.model.AssistantLink;
import ma.nafura.platform.ai.agent.service.navigation.HelpEntry;
import ma.nafura.platform.ai.agent.service.navigation.HelpRegistry;
import org.springframework.stereotype.Component;

@Component
public class SektorHelpRegistry implements HelpRegistry {

    @Override
    public List<HelpEntry> all() {
        return List.of(
                entry(List.of("situation", "situations"), """
                        Les situations de travaux se créent depuis Chantiers > Situations.
                        Sélectionnez d'abord un chantier actif.""",
                        link("Situations", "/chantiers/situations")),
                entry(List.of("stock", "inventaire", "article"), """
                        Le stock est géré dans Inventory > Stock. Vous y voyez les quantités par article et entrepôt.""",
                        link("Stock", "/inventory/stock")),
                entry(List.of("partner", "fournisseur", "client"), """
                        Les partenaires (clients/fournisseurs) sont dans Directory > Partners.""",
                        link("Partners", "/directory/partners")),
                entry(List.of("chantier", "projets"), """
                        Les chantiers sont le fil roui métier. Accédez à la liste depuis le menu Chantiers.""",
                        link("Chantiers", "/chantiers")),
                entry(List.of("default"), """
                        Je ne suis pas sûr. Reformulez ou précisez le module (chantiers, stock, finance, achats…).""",
                        link("Dashboard", "/dashboard"))
        );
    }

    @Override
    public Optional<HelpEntry> match(String question) {
        if (question == null || question.isBlank()) {
            return Optional.empty();
        }
        String normalized = question.toLowerCase(Locale.ROOT);
        return all().stream()
                .filter(entry -> entry.getKeywords().stream()
                        .anyMatch(keyword -> normalized.contains(keyword.toLowerCase(Locale.ROOT))))
                .findFirst();
    }

    private HelpEntry entry(List<String> keywords, String answer, AssistantLink link) {
        return HelpEntry.builder().keywords(keywords).answer(answer).links(List.of(link)).build();
    }

    private AssistantLink link(String label, String route) {
        return AssistantLink.builder().label(label).route(route).autoNavigate(false).build();
    }
}
