package ma.nafura.sektor.ai;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import ma.nafura.platform.ai.agent.model.AssistantLink;
import ma.nafura.platform.ai.agent.service.navigation.HelpEntry;
import ma.nafura.platform.ai.agent.service.navigation.HelpRegistry;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SektorHelpRegistry implements HelpRegistry {

    private final SektorScreenCatalog catalog;

    public SektorHelpRegistry(SektorScreenCatalog catalog) {
        this.catalog = catalog;
    }

    @Override
    public List<HelpEntry> all() {
        List<HelpEntry> entries = new ArrayList<>();
        for (ScreenCatalogEntry screen : catalog.screens()) {
            entries.add(toEntry(screen));
        }
        entries.add(HelpEntry.builder()
                .keywords(List.of("default"))
                .answer("Je ne suis pas sûr. Précisez l'écran (articles, chantiers, factures…).")
                .links(List.of(link("Tableau de bord", "/dashboard")))
                .build());
        return entries;
    }

    @Override
    public Optional<HelpEntry> match(String question) {
        if (question == null || question.isBlank()) {
            return Optional.empty();
        }
        String folded = ScreenCatalogScoring.fold(question);
        ScreenCatalogEntry best = null;
        int bestScore = 0;
        for (ScreenCatalogEntry screen : catalog.screens()) {
            int score = ScreenCatalogScoring.score(screen, folded);
            if (score > bestScore) {
                bestScore = score;
                best = screen;
            }
        }
        return best == null ? Optional.empty() : Optional.of(toEntry(best));
    }

    private HelpEntry toEntry(ScreenCatalogEntry screen) {
        List<AssistantLink> links = new ArrayList<>();
        links.add(link(screen.getLabel(), screen.getRoute()));
        if (screen.getCreateRoute() != null && !screen.getCreateRoute().isBlank()) {
            links.add(link("Créer — " + screen.getLabel(), screen.getCreateRoute()));
        }
        return HelpEntry.builder()
                .keywords(screen.getKeywords())
                .answer(screen.getHelp() != null ? screen.getHelp() : screen.getLabel())
                .links(links)
                .build();
    }

    private AssistantLink link(String label, String route) {
        return AssistantLink.builder()
                .label(label != null ? label : route)
                .route(route)
                .autoNavigate(false)
                .build();
    }
}
