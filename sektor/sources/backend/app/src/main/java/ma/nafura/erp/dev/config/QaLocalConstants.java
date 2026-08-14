package ma.nafura.erp.dev.config;

/**
 * Fixed identities for local Mode B QA (humain + agents).
 * See epic {@code qa-local-auth-seed}.
 */
public final class QaLocalConstants {

    public static final String TENANT_KEY = "qa-local";
    public static final String TENANT_NAME = "QA Local";
    public static final String OWNER_EMAIL = "qa@nafuralabs.local";
    public static final String OWNER_NAME = "QA Owner";

    /** Deprecated Mode B email — remapped to {@link #OWNER_EMAIL}. */
    public static final String DEPRECATED_CURSOR_QA_EMAIL = "cursor.qa@nafuralabs.local";

    public static final String APPLICATION_ID = "erp";

    private QaLocalConstants() {}
}
