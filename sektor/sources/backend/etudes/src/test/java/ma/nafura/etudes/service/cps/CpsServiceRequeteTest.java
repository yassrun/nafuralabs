package ma.nafura.etudes.service.cps;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import org.junit.jupiter.api.Test;

class CpsServiceRequeteTest {

    @Test
    void normaliseLesTiretsDuCodePourLeTsquery() {
        assertEquals("1.1.3", CpsService.normaliserCodePourRecherche("1-1-3"));
        assertEquals("1.1.3", CpsService.normaliserCodePourRecherche("1.1.3"));
    }

    @Test
    void construireRequeteCombineCodeNormaliseEtLibelle() {
        DpgfNoeud article = DpgfNoeud.builder()
                .code("1-1-3")
                .libelle("BÉTON ARME EN INFRASTRUCTURE POUR TOUS OUVRAGES")
                .build();

        assertEquals(
                "1.1.3 BÉTON ARME EN INFRASTRUCTURE POUR TOUS OUVRAGES",
                CpsService.construireRequete(article));
    }

    @Test
    void tsQueryOrGardeLesMotsPorteursSansDimensions() {
        DpgfNoeud article = DpgfNoeud.builder()
                .code("6.1.3")
                .libelle("REVETEMENT DE SOL EN CARREAUX GRES CERAME ANTIDERAPENT D'IMPORTATION DE 20X20 Y COMPRIS PLINTHES DE 7 CM")
                .build();

        String q = CpsService.construireTsQueryOr(article);
        assertTrue(q.contains("revetement"));
        assertTrue(q.contains("carreaux") || q.contains("gres") || q.contains("cerame"));
        assertFalse(q.contains("20x20"));
        assertFalse(q.contains("compris"));
        assertFalse(q.contains("importation"));
    }

    @Test
    void tsQueryOrEstUnOuPasUnAnd() {
        DpgfNoeud article = DpgfNoeud.builder()
                .libelle("REVETEMENT DE SOL EN CARREAUX")
                .build();
        String q = CpsService.construireTsQueryOr(article);
        assertTrue(q.contains(" | "));
        assertEquals("revetement | sol | carreaux", q);
    }
}
