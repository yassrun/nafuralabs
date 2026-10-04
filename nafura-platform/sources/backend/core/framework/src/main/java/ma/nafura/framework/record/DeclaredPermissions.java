package ma.nafura.platform.framework.record;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Permission ids declared by the business contexts on the classpath. */
public final class DeclaredPermissions {

    private static final ObjectMapper JSON = new ObjectMapper();

    private DeclaredPermissions() {
    }

    public static Set<String> load() {
        Set<String> ids = new HashSet<>();
        try {
            Resource[] resources = new PathMatchingResourcePatternResolver().getResources("classpath*:META-INF/nafura/bc/*.json");
            for (Resource resource : resources) {
                JsonNode permissions = JSON.readTree(resource.getInputStream()).path("spec").path("permissions");
                if (permissions.isArray()) {
                    permissions.forEach(node -> {
                        String id = node.path("id").asText("");
                        if (!id.isBlank()) ids.add(id);
                    });
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("Cannot read business context manifests", e);
        }
        return ids;
    }
}
