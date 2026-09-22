package ma.nafura.sandbox.lab;

import java.util.List;

/**
 * Lab identities. No Keycloak — sessions are HS256 tokens minted locally.
 */
public final class SandboxLabUsers {

    public static final String ADMIN_EMAIL = "admin@sandbox.local";

    public record LabUser(String email, String givenName, String familyName, String role) {
        public String displayName() {
            return (givenName + " " + familyName).trim();
        }

        public boolean superAdmin() {
            return "SUPER_ADMIN".equals(role);
        }
    }

    public static final List<LabUser> ALL = List.of(
            new LabUser(ADMIN_EMAIL, "Sandbox", "Admin", "SUPER_ADMIN"),
            new LabUser("reader@sandbox.local", "Sandbox", "Reader", "READER")
    );

    private SandboxLabUsers() {
    }

    public static LabUser require(String email) {
        if (email == null || email.isBlank()) {
            return ALL.get(0);
        }
        String normalized = email.trim().toLowerCase();
        return ALL.stream()
                .filter(user -> user.email().equalsIgnoreCase(normalized))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown sandbox lab user: " + email));
    }
}
