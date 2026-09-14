package ma.nafura.platform.ai.agent.service.intent;

import static org.junit.jupiter.api.Assertions.assertEquals;

import ma.nafura.platform.ai.agent.model.IntentType;
import org.junit.jupiter.api.Test;

class IntentRouterTest {

    private final IntentRouter router = new IntentRouter();

    @Test
    void classifyReadIntentForCountQuestion() {
        assertEquals(IntentType.READ, router.classify("Combien d'articles j'ai en stock ?").getIntent());
    }

    @Test
    void classifyNavigateIntentForWhereQuestion() {
        assertEquals(IntentType.NAVIGATE, router.classify("Où configurer les workflows ?").getIntent());
    }

    @Test
    void classifyCreateRequestAsNavigateForAssistant() {
        assertEquals(IntentType.NAVIGATE, router.classify("Creer le fournisseur ACME").getIntent());
        assertEquals(IntentType.NAVIGATE, router.classify("ajoute moi un article qsq").getIntent());
    }

    @Test
    void classifyHowToPriceAStudyAsNavigate() {
        assertEquals(IntentType.NAVIGATE, router.classify("comment je peux chiffré une etude").getIntent());
        assertEquals(IntentType.NAVIGATE, router.classify("comment je peux ajouter un article").getIntent());
    }

    @Test
    void classifyIWillDoAStudyAsNavigate() {
        assertEquals(IntentType.NAVIGATE, router.classify("non je vais faire une etude").getIntent());
    }
}
