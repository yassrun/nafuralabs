package ma.nafura.platform.ai.llm.cost;

import ma.nafura.platform.ai.llm.model.TokenUsage;

import java.util.HashMap;
import java.util.Map;

public class DefaultCostCalculator implements CostCalculator {
    private final Map<String, ModelPricing> pricingMap;

    public DefaultCostCalculator() {
        this.pricingMap = new HashMap<>();
        // Pricing per 1M tokens (indicative defaults; can be overridden in future settings).
        pricingMap.put("gemini-1.5-flash", new ModelPricing(0.35, 1.05));
        pricingMap.put("gemini-2.0-flash", new ModelPricing(0.10, 0.40));
        pricingMap.put("gemini-2.5-flash", new ModelPricing(0.15, 0.60));
        pricingMap.put("gemini-2.5-flash-lite", new ModelPricing(0.10, 0.40));
    }

    @Override
    public double calculateCost(TokenUsage usage, String provider, String model) {
        if (usage == null || usage.getInputTokens() == null || usage.getOutputTokens() == null) {
            return 0.0;
        }

        ModelPricing pricing = pricingMap.get(model);
        if (pricing == null) {
            if (model != null && model.startsWith("gemini-2.")) {
                pricing = pricingMap.get("gemini-2.0-flash");
            } else if (model != null && model.startsWith("gemini-1.5")) {
                pricing = pricingMap.get("gemini-1.5-flash");
            }
        }
        if (pricing == null) {
            return 0.0;
        }

        double inputCost = (usage.getInputTokens() / 1_000_000.0) * pricing.inputRate;
        double outputCost = (usage.getOutputTokens() / 1_000_000.0) * pricing.outputRate;
        
        return inputCost + outputCost;
    }

    public void setPricing(String model, double inputRate, double outputRate) {
        pricingMap.put(model, new ModelPricing(inputRate, outputRate));
    }

    private static class ModelPricing {
        final double inputRate;
        final double outputRate;

        ModelPricing(double inputRate, double outputRate) {
            this.inputRate = inputRate;
            this.outputRate = outputRate;
        }
    }
}

