package ma.nafura.usageops.api.security;

import ma.nafura.platform.framework.context.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class OpsSuperAdminAccess {

    private OpsSuperAdminAccess() {
    }

    public static void require() {
        if (!UserContext.isSuperAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super admin required");
        }
    }
}
