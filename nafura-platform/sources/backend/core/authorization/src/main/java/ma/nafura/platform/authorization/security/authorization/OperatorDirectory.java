package ma.nafura.platform.authorization.security.authorization;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

import ma.nafura.platform.framework.context.UserContext;
import org.springframework.core.env.Environment;

/**
 * Emails of {@code spec.deploy.<env>.operators}. The only way to hold {@code platform.operator.*}.
 */
public class OperatorDirectory {

    private final Set<String> emails;

    public OperatorDirectory(Environment environment) {
        LinkedHashSet<String> found = new LinkedHashSet<>();
        for (int i = 0; ; i++) {
            String email = environment.getProperty("nafura.access.operators[" + i + "]");
            if (email == null || email.isBlank()) {
                break;
            }
            found.add(email.trim().toLowerCase(Locale.ROOT));
        }
        this.emails = Set.copyOf(found);
    }

    public boolean isOperator(String email) {
        return email != null && emails.contains(email.trim().toLowerCase(Locale.ROOT));
    }

    public boolean isCurrentOperator() {
        return isOperator(UserContext.getUserEmail());
    }

    /** Adds the explicit operator grant. Does nothing for anyone else, including super admins. */
    public void grantToCurrentUser() {
        if (!isCurrentOperator()) {
            return;
        }
        LinkedHashSet<String> next = new LinkedHashSet<>(UserContext.getPermissions());
        next.add(OperatorPermissions.ALL);
        UserContext.setPermissions(next);
    }
}
