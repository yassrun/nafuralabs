package ma.nafura.platform.authorization.api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * How the web app signs in, decided by the environment, not the product: the lab picker locally,
 * the shared OIDC provider (Keycloak) on clusters.
 */
@RestController
public class AuthConfigController {

    private final boolean lab;
    private final String issuer;
    private final String clientId;

    public AuthConfigController(
            @Value("${nafura.lab.enabled:false}") boolean lab,
            @Value("${nafura.security.oidc.issuer:}") String issuer,
            @Value("${nafura.security.oidc.client-id:}") String clientId) {
        this.lab = lab;
        this.issuer = issuer;
        this.clientId = clientId;
    }

    public record AuthConfig(String mode, String issuer, String clientId, String usersUrl, String sessionUrl) {
    }

    @GetMapping("/api/public/auth/config")
    public AuthConfig config() {
        if (lab) {
            return new AuthConfig("lab", null, null, "/api/public/lab/users", "/api/public/lab/session");
        }
        return new AuthConfig("oidc", issuer, clientId, null, null);
    }
}
