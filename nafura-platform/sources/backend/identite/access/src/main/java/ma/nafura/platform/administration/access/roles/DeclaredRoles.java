package ma.nafura.platform.administration.access.roles;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Roles declared by configuration: the platform's generic roles, each business context's default roles,
 * then the application's cross-BC roles with their {@code includes} expanded to permissions. Same rules as
 * the web validator. Only platform roles may grant wildcards ({@code tenant.*}): they cover whole capabilities.
 */
public final class DeclaredRoles {

    /** Owner of the roles every application gets (META-INF/nafura/platform/roles.json). */
    public static final String PLATFORM = "platform";

    private DeclaredRoles() {
    }

    public record Role(String code, String label, String owner, Set<String> permissions) {
    }

    public static Map<String, Role> resolve(JsonNode application, List<JsonNode> businessContexts) {
        return resolve(null, application, businessContexts);
    }

    public static Map<String, Role> resolve(JsonNode platform, JsonNode application, List<JsonNode> businessContexts) {
        List<String> problems = new ArrayList<>();
        Map<String, Role> roles = new LinkedHashMap<>();
        if (platform != null) {
            for (JsonNode role : platform.path("roles")) {
                String code = role.path("code").asText();
                put(roles, new Role(code, role.path("label").asText(code), PLATFORM, strings(role.path("permissions"))), problems);
            }
        }

        Map<String, JsonNode> contextsById = new LinkedHashMap<>();
        for (JsonNode context : businessContexts) {
            contextsById.put(context.path("metadata").path("id").asText(), context);
        }

        List<JsonNode> embedded = new ArrayList<>();
        for (JsonNode reference : application.path("spec").path("businessContexts")) {
            JsonNode context = contextsById.get(reference.asText());
            if (context == null) {
                problems.add("business context " + reference.asText() + " has no manifest on the classpath");
            } else {
                embedded.add(context);
            }
        }

        Map<String, Set<String>> bcRoles = new LinkedHashMap<>();
        Set<String> declaredPermissions = new LinkedHashSet<>();

        for (JsonNode context : embedded) {
            String contextId = context.path("metadata").path("id").asText();
            String namespace = contextId.substring(contextId.indexOf('.') + 1) + ".";
            Set<String> permissions = new LinkedHashSet<>();
            for (JsonNode permission : context.path("spec").path("permissions")) {
                String id = permission.path("id").asText();
                if (!id.startsWith(namespace)) {
                    problems.add(contextId + " declares " + id + " outside " + namespace);
                }
                permissions.add(id);
            }
            declaredPermissions.addAll(permissions);

            for (JsonNode role : context.path("spec").path("defaultRoles")) {
                String code = role.path("code").asText();
                Set<String> granted = strings(role.path("permissions"));
                granted.stream().filter(p -> !permissions.contains(p))
                        .forEach(p -> problems.add(contextId + ":" + code + " grants undeclared " + p));
                bcRoles.put(contextId + ":" + code, granted);
                put(roles, new Role(code, role.path("label").asText(code), contextId, granted), problems);
            }
        }

        String appId = application.path("metadata").path("id").asText();
        for (JsonNode role : application.path("spec").path("roles")) {
            String code = role.path("code").asText();
            Set<String> granted = new LinkedHashSet<>();
            for (String reference : strings(role.path("includes"))) {
                Set<String> included = bcRoles.get(reference);
                if (included == null) {
                    problems.add(code + " includes " + reference + ", not a role of an embedded business context");
                } else {
                    granted.addAll(included);
                }
            }
            for (String permission : strings(role.path("permissions"))) {
                if (!declaredPermissions.contains(permission)) {
                    problems.add(code + " grants " + permission + ", declared by no embedded business context");
                }
                granted.add(permission);
            }
            put(roles, new Role(code, role.path("label").asText(code), appId, granted), problems);
        }

        if (!problems.isEmpty()) {
            throw new IllegalStateException("Invalid role declarations:\n - " + String.join("\n - ", problems));
        }
        return roles;
    }

    private static void put(Map<String, Role> roles, Role role, List<String> problems) {
        Role previous = roles.putIfAbsent(role.code(), role);
        if (previous != null) {
            problems.add("role code " + role.code() + " declared by both " + previous.owner() + " and " + role.owner());
        }
    }

    private static Set<String> strings(JsonNode array) {
        Set<String> values = new LinkedHashSet<>();
        array.forEach(node -> values.add(node.asText()));
        return values;
    }
}
