package ma.nafura.etudes.service.cps;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
}
