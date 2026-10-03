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
        environment.getPropertySources().addLast(new MapPropertySource("nafuraApplicationManifest", properties(manifest)));
    }

    static Map<String, Object> properties(JsonNode manifest) {
        String id = manifest.path("metadata").path("id").asText().replaceFirst("^app\\.", "");
        String name = manifest.path("spec").path("product").path("name").asText(id);
        Map<String, Object> properties = new HashMap<>();
        properties.put("spring.application.name", id);
        properties.put("nafura.application.id", id);
        properties.put("nafura.application.name", name);
        properties.put("nafura.lab.issuer", id + "-lab");
        properties.put("nafura.security.tenant.mode", manifest.path("spec").path("runtime").path("tenancy").asText("single"));
        // The product's OIDC client: tokens issued to another client of the shared realm are refused.
        properties.put("nafura.security.oidc.client-id", id);
        if (manifest.path("spec").path("customRoles").isBoolean()) {
            properties.put("nafura.roles.custom-enabled", manifest.path("spec").path("customRoles").asBoolean());
        }
        JsonNode local = manifest.path("spec").path("local");
        if (local.path("ports").has("api")) {
            properties.put("server.port", local.path("ports").path("api").asInt());
        }
        JsonNode users = local.path("users");
        for (int i = 0; i < users.size(); i++) {
            JsonNode user = users.get(i);
            String prefix = "nafura.lab.users[" + i + "].";
            properties.put(prefix + "email", user.path("email").asText());
            properties.put(prefix + "given-name", user.path("givenName").asText());
            properties.put(prefix + "family-name", user.path("familyName").asText());
            properties.put(prefix + "role", user.path("role").asText());
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
