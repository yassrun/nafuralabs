package ma.nafura.sektor.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.ai.agent.service.navigation.NavigationTarget;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SektorNavigationRegistryTest {

    private SektorNavigationRegistry registry;
    private SektorHelpRegistry helpRegistry;

    @BeforeEach
    void setUp() {
        SektorScreenCatalog catalog = new SektorScreenCatalog(new ObjectMapper());
        registry = new SektorNavigationRegistry(catalog);
        helpRegistry = new SektorHelpRegistry(catalog);
    }

    @Test
    void catalogContainsSidebarScreens() {
        assertTrue(registry.all().size() >= 40);
        assertTrue(registry.all().stream().anyMatch(t -> "/inventory/catalogue/articles".equals(t.getRoute())));
    }

    @Test
    void articleResolvesToCatalogueNotLegacyStock() {
        NavigationTarget target = registry.resolve("ajoute moi un article", "article", null).orElseThrow();
        assertEquals("/inventory/catalogue/articles", target.getRoute());
        assertEquals("/inventory/catalogue/articles/new", target.getCreateRoute());
        assertFalse("/inventory/stock".equals(target.getRoute()));
    }

    @Test
    void faireUneEtudeResolvesToDossiers() {
        NavigationTarget target = registry.resolve("non je vais faire une etude", null, null).orElseThrow();
        assertEquals("/etudes/dossiers", target.getRoute());
    }

    @Test
    void chiffrerUneEtudeResolvesToDevis() {
        NavigationTarget target = registry.resolve("comment je peux chiffré une etude", null, null).orElseThrow();
        assertEquals("/etudes/devis", target.getRoute());
        assertEquals("/etudes/devis/new", target.getCreateRoute());
    }

    @Test
    void helpForArticlePointsToCatalogue() {
        var help = helpRegistry.match("comment créer un article").orElseThrow();
        assertTrue(help.getLinks().stream().anyMatch(link ->
                "/inventory/catalogue/articles".equals(link.getRoute())
                        || "/inventory/catalogue/articles/new".equals(link.getRoute())));
        assertTrue(help.getLinks().stream().noneMatch(link -> "/inventory/stock".equals(link.getRoute())));
    }
}
