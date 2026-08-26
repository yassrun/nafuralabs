package ma.nafura.socle.dev.config;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Fixed identities for local Mode B QA (humain + agents).
 * See epic {@code qa-local-auth-seed}.
 */
public final class QaLocalConstants {

    public static final String TENANT_KEY = "qa-local";
    public static final String TENANT_NAME = "QA Local";
    public static final String OWNER_EMAIL = "qa@nafuralabs.local";
    public static final String OWNER_NAME = "QA Owner";
    public static final String OWNER_ALIAS = "owner";

    /** Deprecated Mode B email — remapped to {@link #OWNER_EMAIL}. */
    public static final String DEPRECATED_CURSOR_QA_EMAIL = "cursor.qa@nafuralabs.local";

    public static final String APPLICATION_ID = "erp";

    /**
     * Narrow IAM users on {@code qa-local}. Auto-login stays {@link #OWNER_EMAIL}.
     * Alias is what {@code qa-token.sh} / {@code ?role=} accept.
     */
    public record RoleUser(String alias, String email, String name, String tenantRoleCode) {}

    public static final List<RoleUser> ROLE_USERS = List.of(
        new RoleUser("ingenieur", "qa.ingenieur@nafuralabs.local", "QA Ingenieur", "BTP_INGENIEUR"),
        new RoleUser("conducteur", "qa.conducteur@nafuralabs.local", "QA Conducteur", "BTP_CONDUCTEUR_TRAVAUX"),
        new RoleUser("directeur", "qa.directeur@nafuralabs.local", "QA Directeur", "BTP_DIRECTEUR_TRAVAUX"),
        new RoleUser("daf", "qa.daf@nafuralabs.local", "QA Daf", "BTP_DAF"),
        new RoleUser("dg", "qa.dg@nafuralabs.local", "QA Dg", "BTP_DG"),
        new RoleUser("chef-chantier", "qa.chef-chantier@nafuralabs.local", "QA Chef Chantier", "BTP_CHEF_CHANTIER"),
        new RoleUser("magasinier", "qa.magasinier@nafuralabs.local", "QA Magasinier", "BTP_MAGASINIER")
    );

    private QaLocalConstants() {}

    /** Prefer {@code qa@…}; remap deprecated {@code cursor.qa@…}. */
    public static String resolveAuthEmail(String configured) {
        if (configured == null || configured.isBlank()
            || DEPRECATED_CURSOR_QA_EMAIL.equalsIgnoreCase(configured.trim())) {
            return OWNER_EMAIL;
        }
        return configured.trim();
    }

    public static boolean isOwnerEmail(String email) {
        return email != null && OWNER_EMAIL.equalsIgnoreCase(email.trim());
    }

    public static boolean isAllowlistedEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String trimmed = email.trim();
        if (OWNER_EMAIL.equalsIgnoreCase(trimmed)
            || DEPRECATED_CURSOR_QA_EMAIL.equalsIgnoreCase(trimmed)) {
            return true;
        }
        return ROLE_USERS.stream().anyMatch(u -> u.email().equalsIgnoreCase(trimmed));
    }

    public static Optional<String> emailForAlias(String alias) {
        if (alias == null || alias.isBlank()) {
            return Optional.empty();
        }
        String key = alias.trim().toLowerCase(Locale.ROOT);
        if ("owner".equals(key) || "qa".equals(key) || "default".equals(key)) {
            return Optional.of(OWNER_EMAIL);
        }
        if ("chef".equals(key)) {
            key = "chef-chantier";
        }
        String resolved = key;
        return ROLE_USERS.stream()
            .filter(u -> u.alias().equals(resolved))
            .map(RoleUser::email)
            .findFirst();
    }

    /**
     * Default = owner (or {@code NAFURA_DEV_CURSOR_AUTH_EMAIL}).
     * {@code requestedEmail} / {@code requestedRole} must be on the allowlist.
     */
    public static String resolveSessionEmail(String configured, String requestedEmail, String requestedRole) {
        if (requestedEmail != null && !requestedEmail.isBlank()) {
            String email = requestedEmail.trim();
            if (DEPRECATED_CURSOR_QA_EMAIL.equalsIgnoreCase(email)) {
                return OWNER_EMAIL;
            }
            if (!isAllowlistedEmail(email)) {
                throw new IllegalArgumentException("Unknown QA email: " + email);
            }
            return email;
        }
        if (requestedRole != null && !requestedRole.isBlank()) {
            return emailForAlias(requestedRole)
                .orElseThrow(() -> new IllegalArgumentException("Unknown QA role: " + requestedRole));
        }
        return resolveAuthEmail(configured);
    }
}
