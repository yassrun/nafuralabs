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
    void classifyActionIntentForCreateRequest() {
        assertEquals(IntentType.ACTION, router.classify("Creer le contact ACME").getIntent());
    }
}
