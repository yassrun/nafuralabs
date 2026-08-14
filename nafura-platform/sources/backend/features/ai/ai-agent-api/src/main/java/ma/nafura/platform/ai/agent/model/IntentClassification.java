package ma.nafura.platform.ai.agent.model;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class IntentClassification {
    private final IntentType intent;
    /** Confidence 0.0–1.0; rule-based matches use 1.0. */
    private final double confidence;
    /** How the intent was determined: RULES or LLM. */
    private final String source;
}
