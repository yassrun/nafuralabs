package ma.nafura.platform.administration.usage.security;

import ma.nafura.platform.framework.context.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class SuperAdminAccess {

    private SuperAdminAccess() {
    }

    public static void require() {
        if (!UserContext.isSuperAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super admin required");
        }
    }
}
