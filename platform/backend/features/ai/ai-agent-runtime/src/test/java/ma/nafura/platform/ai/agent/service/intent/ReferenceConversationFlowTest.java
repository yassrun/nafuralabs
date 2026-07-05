package ma.nafura.platform.ai.agent.service.intent;

import static org.junit.jupiter.api.Assertions.assertEquals;

import ma.nafura.platform.ai.agent.model.IntentType;
import org.junit.jupiter.api.Test;

/**
 * Reference conversation flows from the redesign plan.
 */
class ReferenceConversationFlowTest {

    private final IntentRouter router = new IntentRouter();

    @Test
    void stockCountQuestionIsReadIntent() {
        assertEquals(IntentType.READ, router.classify("Combien d'articles j'ai en stock ?").getIntent());
    }

    @Test
    void openChantierIsNavigateIntent() {
        assertEquals(IntentType.NAVIGATE, router.classify("Ouvre le chantier CH-001").getIntent());
    }

    @Test
    void createSupplierIsActionIntent() {
        assertEquals(IntentType.ACTION, router.classify("Creer le fournisseur ACME").getIntent());
    }
}
