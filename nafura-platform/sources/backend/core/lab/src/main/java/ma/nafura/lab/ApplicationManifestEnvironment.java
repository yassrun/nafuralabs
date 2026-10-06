package ma.nafura.lab;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * The product names itself once, in app.nafura.json: application id, display name, tenancy, lab users,
 * local API port. Lowest priority, so environment variables and profiles still override.
 */
public class ApplicationManifestEnvironment implements EnvironmentPostProcessor {

    /** Copied there at build time by nafura-host.gradle. */
    static final String MANIFEST = "nafura/app.nafura.json";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        JsonNode manifest = read(application.getClassLoader());
        if (manifest == null) {
            return;
        }
        environment.getPropertySources().addLast(new MapPropertySource("nafuraApplicationManifest", properties(manifest, deploymentEnv(environment))));
    }

    /** Lab unless the process is staging or prod. Operators and owners are read from that deployment block. */
    static String deploymentEnv(ConfigurableEnvironment environment) {
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equals(profile)) {
                return "prod";
            }
        }
        for (String profile : environment.getActiveProfiles()) {
            if ("staging".equals(profile)) {
                return "staging";
            }
        }
        return "lab";
    }

    static Map<String, Object> properties(JsonNode manifest) {
        return properties(manifest, "lab");
    }

    static Map<String, Object> properties(JsonNode manifest, String deploymentEnv) {
        String id = manifest.path("metadata").path("id").asText().replaceFirst("^app\\.", "");
        String name = manifest.path("spec").path("product").path("name").asText(id);
        Map<String, Object> properties = new HashMap<>();
        properties.put("spring.application.name", id);
        properties.put("nafura.application.id", id);
        properties.put("nafura.application.name", name);
        properties.put("nafura.lab.issuer", id + "-lab");
        properties.put("nafura.security.tenant.mode", manifest.path("spec").path("runtime").path("tenancy").asText("single"));
        String signup = manifest.path("spec").path("runtime").path("signup").asText("operator");
        if (!"operator".equals(signup) && !"open".equals(signup)) {
            throw new IllegalStateException("spec.runtime.signup must be \"operator\" or \"open\" (got " + signup + ")");
        }
        properties.put("nafura.runtime.signup", signup);
        // The product's OIDC client: tokens issued to another client of the shared realm are refused.
        properties.put("nafura.security.oidc.client-id", id);
        if (manifest.path("spec").path("customRoles").isBoolean()) {
            properties.put("nafura.roles.custom-enabled", manifest.path("spec").path("customRoles").asBoolean());
        }
        JsonNode local = manifest.path("spec").path("local");
        if (local.path("ports").has("api")) {
            properties.put("server.port", local.path("ports").path("api").asInt());
        }
        if (local.path("ports").has("web")) {
            int webPort = local.path("ports").path("web").asInt();
            properties.put("app.frontend-base-url", "http://localhost:" + webPort);
        }
        JsonNode organizations = local.path("organizations");
        for (int i = 0; i < organizations.size(); i++) {
            JsonNode organization = organizations.get(i);
            String prefix = "nafura.lab.organizations[" + i + "].";
            properties.put(prefix + "key", organization.path("key").asText());
            properties.put(prefix + "name", organization.path("name").asText());
        }
        JsonNode users = local.path("users");
        for (int i = 0; i < users.size(); i++) {
            JsonNode user = users.get(i);
            String prefix = "nafura.lab.users[" + i + "].";
            properties.put(prefix + "email", user.path("email").asText());
            properties.put(prefix + "given-name", user.path("givenName").asText());
            properties.put(prefix + "family-name", user.path("familyName").asText());
            properties.put(prefix + "role", user.path("role").asText());
            JsonNode memberships = user.path("organizations");
            for (int j = 0; j < memberships.size(); j++) {
                JsonNode membership = memberships.get(j);
                String membershipPrefix = prefix + "organizations[" + j + "].";
                if (membership.isTextual()) {
                    properties.put(membershipPrefix + "key", membership.asText());
                } else {
                    properties.put(membershipPrefix + "key", membership.path("key").asText());
                    if (membership.hasNonNull("role")) {
                        properties.put(membershipPrefix + "role", membership.path("role").asText());
                    }
                    if (membership.hasNonNull("audience")) {
                        properties.put(membershipPrefix + "audience", membership.path("audience").asText());
                    }
                }
            }
        }
        JsonNode operators = manifest.path("spec").path("deploy").path(deploymentEnv).path("operators");
        for (int i = 0; i < operators.size(); i++) {
            properties.put("nafura.access.operators[" + i + "]", operators.get(i).asText());
        }
        return properties;
    }

    private static JsonNode read(ClassLoader classLoader) {
        try (InputStream in = classLoader.getResourceAsStream(MANIFEST)) {
            return in == null ? null : new ObjectMapper().readTree(in);
        } catch (IOException e) {
            throw new UncheckedIOException("Unreadable " + MANIFEST, e);
        }
    }
}
