package ma.nafura.lab;

import java.util.List;
import java.util.Map;

import ma.nafura.platform.authorization.security.authorization.PublicEndpoint;
import ma.nafura.platform.authorization.security.jwt.LabSessionTokenIssuer;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/public/lab")
public class LabSessionController {

    private final LabProperties properties;
    private final String hs256Secret;
    private final AppUserRepository appUserRepository;

    public LabSessionController(LabProperties properties, String hs256Secret, AppUserRepository appUserRepository) {
        this.properties = properties;
        this.hs256Secret = hs256Secret;
        this.appUserRepository = appUserRepository;
    }

    public record SessionRequest(String email) {
    }

    @GetMapping("/users")
    @PublicEndpoint(reason = "Lab identity picker")
    public List<Map<String, String>> users() {
        return properties.users().stream()
                .map(user -> Map.of("email", user.email(), "name", user.displayName(), "role", user.role()))
                .toList();
    }

    @PostMapping("/session")
    @PublicEndpoint(reason = "Lab mock login")
    public Map<String, Object> session(@RequestBody(required = false) SessionRequest request) {
        LabProperties.User labUser;
        try {
            labUser = properties.requireUser(request == null ? null : request.email());
        } catch (IllegalArgumentException unknown) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, unknown.getMessage());
        }
        AppUser appUser = appUserRepository.findByEmailIgnoreCase(labUser.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lab user not seeded"));

        String token = LabSessionTokenIssuer.issue(new LabSessionTokenIssuer.Request(
                hs256Secret,
                properties.issuer(),
                appUser.getId().toString(),
                labUser.email(),
                labUser.givenName(),
                labUser.familyName(),
                labUser.displayName(),
                labUser.role(),
                labUser.superAdmin(),
                properties.sessionTtl().toSeconds()
        ));
        // Who and where: GET /api/v1/me/session, as with any identity provider.
        return Map.of("accessToken", token, "tokenType", "Bearer");
    }
}
