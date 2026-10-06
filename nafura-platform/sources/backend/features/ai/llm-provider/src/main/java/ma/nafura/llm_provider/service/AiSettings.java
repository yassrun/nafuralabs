package ma.nafura.platform.ai.llm.service;

/**
 * Canonical {@code app.ai.*} keys stored in {@code tenant_setting}. Single source of truth for the
 * runtime and the admin UI.
 */
public final class AiSettings {

    private AiSettings() {}

    public static final String KEY_PROVIDER = "app.ai.provider";
    public static final String KEY_MODEL = "app.ai.model";
    public static final String KEY_ENABLED = "app.ai.enabled";
    public static final String KEY_MONTHLY_BUDGET_USD = "app.ai.monthlyBudgetUsd";
    public static final String KEY_RETAIN_PAYLOADS = "app.ai.retainPayloads";
}
