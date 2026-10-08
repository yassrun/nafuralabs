package ma.nafura.platform.administration.access.roles;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * A business context depends on another's published contract ({@code provides} / {@code requires}:
 * version, record keys, notification events), never on its code. Checked at startup from the manifests
 * on the classpath. Capability requirements ({@code cap.*}) stay with the catalogue.
 */
public final class BusinessContextContracts {

    private BusinessContextContracts() {
    }

    public static void check(List<JsonNode> manifests) {
        Map<String, JsonNode> byId = new LinkedHashMap<>();
        List<String> issues = new ArrayList<>();
        for (JsonNode manifest : manifests) {
            String id = manifest.path("metadata").path("id").asText("");
            if (!id.isBlank()) {
                byId.put(id, manifest);
            }
            checkProvides(manifest, issues);
        }
        for (JsonNode manifest : manifests) {
            String id = manifest.path("metadata").path("id").asText("");
            JsonNode requires = manifest.path("spec").path("requires");
            if (!requires.isArray()) {
                continue;
            }
            for (JsonNode requirement : requires) {
                String required = requirement.path("id").asText("");
                if (!required.startsWith("bc.")) {
                    continue;
                }
                JsonNode provider = byId.get(required);
                if (provider == null) {
                    if (!requirement.path("optional").asBoolean(false)) {
                        issues.add(id + " requires missing business context " + required);
                    }
                    continue;
                }
                JsonNode contract = contract(provider);
                if (contract == null) {
                    issues.add(id + " requires " + required + " which publishes no contract");
                    continue;
                }
                String version = requirement.path("version").asText("");
                String provided = contract.path("version").asText("");
                if (!satisfies(provided, version)) {
                    issues.add(id + " requires " + required + " " + version + " but " + provided + " is published");
                }
                JsonNode api = requirement.path("api");
                if (api.isArray()) {
                    for (JsonNode item : api) {
                        if (!contains(contract.path("api"), item.asText())) {
                            issues.add(id + " requires unpublished api " + item.asText() + " of " + required);
                        }
                    }
                }
                JsonNode events = requirement.path("events");
                if (events.isArray()) {
                    for (JsonNode event : events) {
                        if (!contains(contract.path("events"), event.asText())) {
                            issues.add(id + " requires unpublished event " + event.asText() + " of " + required);
                        }
                    }
                }
            }
        }
        if (!issues.isEmpty()) {
            throw new IllegalStateException("Business context contract: " + String.join("; ", issues));
        }
    }

    private static void checkProvides(JsonNode manifest, List<String> issues) {
        String id = manifest.path("metadata").path("id").asText("");
        String version = manifest.path("metadata").path("version").asText("");
        JsonNode records = manifest.path("spec").path("records");
        JsonNode notifications = manifest.path("spec").path("notifications");
        JsonNode provides = manifest.path("spec").path("provides");
        if (!provides.isArray()) {
            return;
        }
        for (JsonNode provided : provides) {
            String contractId = provided.path("id").asText("");
            if (!id.equals(contractId)) {
                issues.add(id + " publishes " + contractId + ": a business context publishes only itself");
            }
            if (!version.equals(provided.path("version").asText(""))) {
                issues.add(id + " publishes version " + provided.path("version").asText("") + " instead of " + version);
            }
            JsonNode api = provided.path("api");
            if (api.isArray()) {
                for (JsonNode item : api) {
                    if (!records.has(item.asText())) {
                        issues.add(id + " publishes api " + item.asText() + " which is not in spec.records");
                    }
                }
            }
            JsonNode events = provided.path("events");
            if (events.isArray()) {
                for (JsonNode event : events) {
                    if (!contains(notifications, event.asText(), "id")) {
                        issues.add(id + " publishes event " + event.asText() + " which is not in spec.notifications");
                    }
                }
            }
        }
    }

    private static JsonNode contract(JsonNode manifest) {
        String id = manifest.path("metadata").path("id").asText("");
        JsonNode provides = manifest.path("spec").path("provides");
        if (!provides.isArray()) {
            return null;
        }
        for (JsonNode provided : provides) {
            if (id.equals(provided.path("id").asText(""))) {
                return provided;
            }
        }
        return null;
    }

    private static boolean contains(JsonNode values, String expected) {
        if (!values.isArray()) {
            return false;
        }
        for (JsonNode value : values) {
            if (expected.equals(value.asText())) {
                return true;
            }
        }
        return false;
    }

    private static boolean contains(JsonNode values, String expected, String field) {
        if (!values.isArray()) {
            return false;
        }
        for (JsonNode value : values) {
            if (expected.equals(value.path(field).asText())) {
                return true;
            }
        }
        return false;
    }

    /** Same caret rule as the manifest validator: {@code ^1.2.3} accepts 1.x from 1.2.3. */
    static boolean satisfies(String actualValue, String rangeValue) {
        int[] actual = parse(actualValue, false);
        int[] range = parse(rangeValue, true);
        if (actual == null || range == null || compare(actual, range) < 0) {
            return false;
        }
        if (range[0] > 0) {
            return actual[0] == range[0];
        }
        if (range[1] > 0) {
            return actual[0] == 0 && actual[1] == range[1];
        }
        return actual[0] == 0 && actual[1] == 0 && actual[2] == range[2];
    }

    private static int compare(int[] left, int[] right) {
        for (int index = 0; index < left.length; index++) {
            if (left[index] != right[index]) {
                return left[index] - right[index];
            }
        }
        return 0;
    }

    private static int[] parse(String value, boolean caret) {
        if (value == null || !value.matches(caret ? "\\^\\d+\\.\\d+\\.\\d+" : "\\d+\\.\\d+\\.\\d+")) {
            return null;
        }
        String[] parts = (caret ? value.substring(1) : value).split("\\.");
        return new int[] { Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), Integer.parseInt(parts[2]) };
    }
}
