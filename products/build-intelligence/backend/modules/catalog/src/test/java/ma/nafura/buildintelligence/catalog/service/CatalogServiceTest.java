package ma.nafura.buildintelligence.catalog.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CatalogServiceTest {

    @Test
    void normalizesDesignation() {
        assertEquals("faux plafond ba13", CatalogService.normalize("  Faux plafond BA13  "));
    }
}
