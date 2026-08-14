package ma.nafura.platform.ai.llm.cost;

import ma.nafura.platform.ai.llm.model.TokenUsage;

public interface CostCalculator {
    double calculateCost(TokenUsage usage, String provider, String model);
}

