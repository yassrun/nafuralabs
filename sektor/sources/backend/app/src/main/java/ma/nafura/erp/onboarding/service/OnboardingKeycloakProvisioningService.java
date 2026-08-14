package ma.nafura.erp.onboarding.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.SignupRequest;
import ma.nafura.erp.onboarding.config.OnboardingProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingKeycloakProvisioningService {

    private static final String MASTER_REALM = "master";
    private static final String ADMIN_CLI = "admin-cli";

    private final OnboardingProperties properties;

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}")
    private String jwkSetUri;

    public boolean isProvisioningRequired() {
        return properties.isKeycloakProvisioningEnabled()
            && !properties.isDevSignupBypass()
            && StringUtils.hasText(resolveAdminUsername())
            && StringUtils.hasText(resolveAdminPassword());
    }

    public void provisionSignupUser(SignupRequest request, boolean emailVerified) {
        if (!isProvisioningRequired()) {
            return;
        }
        String email = normalizeEmail(request.email());
        String realm = properties.getKeycloakRealm();
        RestClient client = adminRestClient();

        Optional<String> existingId = findUserIdByEmail(client, realm, email);
        if (existingId.isPresent()) {
            setPassword(client, realm, existingId.get(), request.password());
            patchUser(client, realm, existingId.get(), Map.of(
                "emailVerified", emailVerified,
                "enabled", true,
                "firstName", request.firstName(),
                "lastName", request.lastName()
            ));
            log.info("Keycloak signup user updated email={} emailVerified={}", email, emailVerified);
            return;
        }

        String userId = createUser(client, realm, request, email, emailVerified);
        setPassword(client, realm, userId, request.password());
        log.info("Keycloak signup user created email={} id={} emailVerified={}", email, userId, emailVerified);
    }

    public void markEmailVerified(String email) {
        if (!isProvisioningRequired()) {
            return;
        }
        String normalized = normalizeEmail(email);
        String realm = properties.getKeycloakRealm();
        RestClient client = adminRestClient();
        String userId = findUserIdByEmail(client, realm, normalized)
            .orElseThrow(() -> new IllegalStateException("KEYCLOAK_USER_NOT_FOUND"));
        patchUser(client, realm, userId, Map.of("emailVerified", true, "enabled", true));
        log.info("Keycloak email verified email={}", normalized);
    }

    public void deleteUserIfExists(String email) {
        if (!isProvisioningRequired()) {
            return;
        }
        String normalized = normalizeEmail(email);
        String realm = properties.getKeycloakRealm();
        RestClient client = adminRestClient();
        findUserIdByEmail(client, realm, normalized).ifPresent(userId -> {
            client.delete().uri("/admin/realms/{realm}/users/{id}", realm, userId).retrieve().toBodilessEntity();
            log.info("Keycloak signup user deleted email={}", normalized);
        });
    }

    public boolean userExists(String email) {
        if (!isProvisioningRequired()) {
            return false;
        }
        return findUserIdByEmail(adminRestClient(), properties.getKeycloakRealm(), normalizeEmail(email)).isPresent();
    }

    private String createUser(RestClient client, String realm, SignupRequest request, String email, boolean emailVerified) {
        Map<String, Object> body = Map.of(
            "username", email,
            "email", email,
            "firstName", request.firstName(),
            "lastName", request.lastName(),
            "enabled", true,
            "emailVerified", emailVerified,
            "attributes", Map.of("nafura_app", List.of(appId()))
        );
        try {
            return client.post()
                .uri("/admin/realms/{realm}/users", realm)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchange((req, res) -> {
                    if (res.getStatusCode().is2xxSuccessful()) {
                        URI location = res.getHeaders().getLocation();
                        if (location == null) {
                            throw new IllegalStateException("KEYCLOAK_PROVISIONING_FAILED: missing Location header");
                        }
                        String path = location.getPath();
                        return path.substring(path.lastIndexOf('/') + 1);
                    }
                    throw new IllegalStateException("KEYCLOAK_PROVISIONING_FAILED: HTTP " + res.getStatusCode().value());
                });
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 409) {
                throw new IllegalArgumentException("EMAIL_ALREADY_REGISTERED");
            }
            throw new IllegalStateException("KEYCLOAK_PROVISIONING_FAILED", ex);
        }
    }

    private void setPassword(RestClient client, String realm, String userId, String password) {
        Map<String, Object> body = Map.of(
            "type", "password",
            "value", password,
            "temporary", false
        );
        client.put()
            .uri("/admin/realms/{realm}/users/{id}/reset-password", realm, userId)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .toBodilessEntity();
    }

    private void patchUser(RestClient client, String realm, String userId, Map<String, Object> fields) {
        client.put()
            .uri("/admin/realms/{realm}/users/{id}", realm, userId)
            .contentType(MediaType.APPLICATION_JSON)
            .body(fields)
            .retrieve()
            .toBodilessEntity();
    }

    private Optional<String> findUserIdByEmail(RestClient client, String realm, String email) {
        JsonNode users = client.get()
            .uri(uriBuilder -> uriBuilder
                .path("/admin/realms/{realm}/users")
                .queryParam("email", email)
                .queryParam("exact", true)
                .build(realm))
            .retrieve()
            .body(JsonNode.class);
        if (users == null || !users.isArray() || users.isEmpty()) {
            return Optional.empty();
        }
        JsonNode id = users.get(0).get("id");
        return id != null && id.isTextual() ? Optional.of(id.asText()) : Optional.empty();
    }

    private RestClient adminRestClient() {
        String baseUrl = resolveAdminBaseUrl();
        String token = obtainAdminToken(baseUrl);
        return RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("Authorization", "Bearer " + token)
            .build();
    }

    private String obtainAdminToken(String baseUrl) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", ADMIN_CLI);
        form.add("username", resolveAdminUsername());
        form.add("password", resolveAdminPassword());

        JsonNode response = RestClient.create()
            .post()
            .uri(baseUrl + "/realms/" + MASTER_REALM + "/protocol/openid-connect/token")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(JsonNode.class);

        if (response == null || !response.hasNonNull("access_token")) {
            throw new IllegalStateException("KEYCLOAK_ADMIN_AUTH_FAILED");
        }
        return response.get("access_token").asText();
    }

    private String resolveAdminBaseUrl() {
        String explicit = properties.getKeycloakAdminUrl();
        if (StringUtils.hasText(explicit)) {
            return stripTrailingSlash(explicit);
        }
        if (StringUtils.hasText(jwkSetUri)) {
            int realmsIdx = jwkSetUri.indexOf("/realms/");
            if (realmsIdx > 0) {
                return stripTrailingSlash(jwkSetUri.substring(0, realmsIdx));
            }
        }
        throw new IllegalStateException("KEYCLOAK_ADMIN_URL not configured");
    }

    private String resolveAdminUsername() {
        return StringUtils.hasText(properties.getKeycloakAdminUsername())
            ? properties.getKeycloakAdminUsername()
            : System.getenv("KEYCLOAK_ADMIN_USERNAME");
    }

    private String resolveAdminPassword() {
        return StringUtils.hasText(properties.getKeycloakAdminPassword())
            ? properties.getKeycloakAdminPassword()
            : System.getenv("KEYCLOAK_ADMIN_PASSWORD");
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String stripTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private String appId() {
        return StringUtils.hasText(properties.getApplicationId()) ? properties.getApplicationId() : "erp";
    }
}
