package ma.nafura.sandbox.lab;

import ma.nafura.platform.authorization.security.authorization.PublicEndpoint;
import ma.nafura.platform.authorization.security.jwt.LabSessionTokenIssuer;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * Sandbox lab roster. Token signing is {@link LabSessionTokenIssuer}.
 */
@RestController
@RequestMapping("/api/public/sandbox")
public class SandboxLabSessionController {

    private static final long SESSION_TTL_SECONDS = 60L * 60L * 12L;

    private final String hs256Secret;
    private final AppUserRepository appUserRepository;

    public SandboxLabSessionController(
            @Value("${nafura.security.jwt.hs256-secret}") String hs256Secret,
            AppUserRepository appUserRepository
    ) {
        this.hs256Secret = hs256Secret;
        this.appUserRepository = appUserRepository;
    }

    public record SessionRequest(String email) {
    }

    @GetMapping("/users")
    @PublicEndpoint(reason = "Sandbox lab identity picker")
    public List<Map<String, String>> users() {
        return SandboxLabUsers.ALL.stream()
                .map(user -> Map.of(
                        "email", user.email(),
                        "name", user.displayName(),
                        "role", user.role()
                ))
                .toList();
    }

    @PostMapping("/session")
    @PublicEndpoint(reason = "Sandbox lab mock login")
    public Map<String, Object> session(@RequestBody(required = false) SessionRequest request) {
        SandboxLabUsers.LabUser labUser = SandboxLabUsers.require(request == null ? null : request.email());
        AppUser appUser = appUserRepository.findByEmailIgnoreCase(labUser.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lab user not seeded"));

        String token = LabSessionTokenIssuer.issue(new LabSessionTokenIssuer.Request(
                hs256Secret,
                "sandbox-lab",
                appUser.getId().toString(),
                labUser.email(),
                labUser.givenName(),
                labUser.familyName(),
                labUser.displayName(),
                labUser.role(),
                labUser.superAdmin(),
                SESSION_TTL_SECONDS
        ));
        return Map.of(
                "accessToken", token,
                "tokenType", "Bearer",
                "email", labUser.email(),
                "name", labUser.displayName(),
                "role", labUser.role()
        );
    }
}
