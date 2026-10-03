package ma.nafura.lab;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("nafura.lab")
public record LabProperties(
        @DefaultValue("false") boolean enabled,
        @DefaultValue("nafura-lab") String issuer,
        @DefaultValue("12h") Duration sessionTtl,
        List<User> users
) {

    public LabProperties {
        users = users == null || users.isEmpty()
                ? List.of(new User("admin@lab.local", "Lab", "Admin", "SUPER_ADMIN"))
                : List.copyOf(users);
    }

    public record User(String email, String givenName, String familyName, String role) {

        public String displayName() {
            return (givenName + " " + familyName).trim();
        }

        public boolean superAdmin() {
            return "SUPER_ADMIN".equals(role);
        }
    }

    /** No email picks the first user, as the lab login page does on first load. */
    public User requireUser(String email) {
        if (email == null || email.isBlank()) {
            return users.get(0);
        }
        return users.stream()
                .filter(user -> user.email().equalsIgnoreCase(email.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown lab user: " + email));
    }
}
