package ma.nafura.platform.ai.llm.catalog;

import java.util.List;

/**
 * Strict, versioned model catalog per provider. The admin UI and the runtime both use this single
 * source of truth: a model outside the list is rejected. Azure models are deployment names chosen
 * by the customer, so no fixed list applies there (validated non-blank only).
 */
public final class AiProviderCatalog {

    private AiProviderCatalog() {}

    public static final List<String> PROVIDERS = List.of("gemini", "deepseek", "openai", "azure-openai");

    public static List<String> models(String provider) {
        return switch (normalize(provider)) {
            case "gemini" -> List.of("gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite");
            case "deepseek" -> List.of("deepseek-flash", "deepseek-v4-flash", "deepseek-v4-pro");
            case "openai" -> List.of("gpt-4o-mini", "gpt-4o", "gpt-4.1-mini");
            case "azure-openai" -> List.of();
            default -> List.of();
        };
    }

    public static String defaultModel(String provider) {
        return switch (normalize(provider)) {
            case "gemini" -> "gemini-2.5-flash";
            case "deepseek" -> "deepseek-flash";
            case "openai" -> "gpt-4o-mini";
            default -> "";
        };
    }

    public static String displayName(String provider) {
        return switch (normalize(provider)) {
            case "gemini" -> "Google Gemini";
            case "deepseek" -> "DeepSeek";
            case "openai" -> "OpenAI";
            case "azure-openai" -> "Azure OpenAI";
            default -> provider;
        };
    }

    /** Azure "models" are customer deployment names, so a fixed allowlist does not apply. */
    public static boolean isDeploymentBased(String provider) {
        return "azure-openai".equals(normalize(provider));
    }

    public static String normalize(String provider) {
        return provider == null ? "" : provider.trim().toLowerCase();
    }
}
