package ma.nafura.platform.ai.agent.service.navigation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class NavigationResolverTest {

    private final NavigationResolver resolver = new NavigationResolver(List.of(new FixtureRegistry()));

    @Test
    void createHintUsesCreateRoute() {
        NavigationTarget target = resolver.resolve("ajoute un article", "article", null).orElseThrow();
        assertEquals("/inventory/catalogue/articles/new", target.getRoute());
    }

    @Test
    void spokenCreateRequestOpensNewArticleScreen() {
        NavigationTarget target = resolver.resolve("ajoute moi un article en stock", null, null).orElseThrow();
        assertEquals("/inventory/catalogue/articles/new", target.getRoute());
    }

    @Test
    void entityIdUsesDetailRoute() {
        NavigationTarget target = resolver.resolve("article", "article", "abc").orElseThrow();
        assertEquals("/inventory/catalogue/articles/abc", target.getRoute());
    }

    @Test
    void inferFromRoutePicksLongestPrefix() {
        NavigationTarget target = resolver.inferFromRoute("/inventory/catalogue/articles/xyz").orElseThrow();
        assertEquals("Articles", target.getLabel());
    }

    @Test
    void llmContextListsCreatePath() {
        String ctx = resolver.buildLlmContext();
        assertTrue(ctx.contains("create=/inventory/catalogue/articles/new"));
    }

    @Test
    void faireUneEtudeResolvesToDossiers() {
        NavigationResolver keywordResolver = new NavigationResolver(List.of(new StudyRegistry()));
        NavigationTarget target = keywordResolver
                .resolve("non je vais faire une etude", null, null)
                .orElseThrow();
        assertEquals("/etudes/dossiers", target.getRoute());
    }

    @Test
    void chiffrerUneEtudeResolvesToDevis() {
        NavigationResolver keywordResolver = new NavigationResolver(List.of(new StudyRegistry()));
        NavigationTarget target = keywordResolver
                .resolve("comment je peux chiffré une etude", null, null)
                .orElseThrow();
        assertEquals("/etudes/devis", target.getRoute());
        assertEquals("Devis", target.getLabel());
    }

    private static final class FixtureRegistry implements NavigationRegistry {
        @Override
        public List<NavigationTarget> all() {
            return List.of(NavigationTarget.builder()
                    .keywords(List.of("article", "articles", "catalogue"))
                    .route("/inventory/catalogue/articles")
                    .label("Articles")
                    .entityType("article")
                    .createRoute("/inventory/catalogue/articles/new")
                    .detailRoute("/inventory/catalogue/articles/{id}")
                    .help("Articles catalogue")
                    .build());
        }

        @Override
        public Optional<NavigationTarget> resolve(String target, String entityType, String entityId) {
            return Optional.of(all().get(0));
        }
    }

    private static final class StudyRegistry implements NavigationRegistry {
        @Override
        public List<NavigationTarget> all() {
            return List.of(
                    NavigationTarget.builder()
                            .keywords(List.of("etudes", "etude", "bibliotheque", "prix"))
                            .route("/etudes/bibliotheque-prix")
                            .label("Bibliothèque de prix")
                            .build(),
                    NavigationTarget.builder()
                            .keywords(List.of("etudes", "etude", "dossiers", "dossier"))
                            .route("/etudes/dossiers")
                            .label("Études / appels d'offres")
                            .build(),
                    NavigationTarget.builder()
                            .keywords(List.of("etudes", "etude", "devis", "chiffre", "chiffrage"))
                            .route("/etudes/devis")
                            .label("Devis")
                            .createRoute("/etudes/devis/new")
                            .build()
            );
        }

        @Override
        public Optional<NavigationTarget> resolve(String target, String entityType, String entityId) {
            return Optional.empty();
        }
    }
}
