package ma.nafura.platform.documents.docextractor.plan;

import com.fasterxml.jackson.databind.JsonNode;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import ma.nafura.platform.documents.docextractor.grid.GridRow;

/**
 * Palier 1 — un plan à partir des en-têtes et du dataSchema. Aucun appel.
 */
public final class HeuristicPlanFactory {

    private HeuristicPlanFactory() {}

    public static Optional<ReadingPlan> fromGrid(List<GridRow> rows, JsonNode schema) {
        if (rows == null || rows.isEmpty() || schema == null || !schema.isObject()) {
            return Optional.empty();
        }
        String arrayPath = firstArrayPath(schema);
        if (arrayPath == null) {
            return Optional.empty();
        }
        JsonNode itemProps = schema.path("properties").path(arrayPath).path("items").path("properties");
        if (!itemProps.isObject() || itemProps.isEmpty()) {
            return Optional.empty();
        }
        List<String> fields = new ArrayList<>();
        Map<String, String> titles = new LinkedHashMap<>();
        collectScalarFields(itemProps, fields, titles);
        TreeShape tree = TreeShape.fromItemProperties(itemProps);
        if (fields.isEmpty()) {
            return Optional.empty();
        }

        int headerIndex = headerRow(rows);
        GridRow header = headerIndex >= 0 ? rows.get(headerIndex) : rows.get(0);
        Map<Integer, String> bindings = matchColumns(header, fields, titles);
        if (bindings.isEmpty()) {
            return Optional.empty();
        }
        List<ReadingPlan.ColumnBinding> columns = new ArrayList<>();
        bindings.forEach((index, field) -> columns.add(new ReadingPlan.ColumnBinding(index, field)));
        return Optional.of(new ReadingPlan(
                "grid:" + header.page(),
                List.of(),
                columns,
                tree.rowClasses(),
                tree.hierarchy(),
                ReadingPlan.Depivot.RESERVED,
                List.of(arrayPath)
        ));
    }

    static String firstArrayPath(JsonNode schema) {
        JsonNode properties = schema.path("properties");
        if (!properties.isObject()) {
            return null;
        }
        var names = properties.fieldNames();
        while (names.hasNext()) {
            String name = names.next();
            JsonNode node = properties.get(name);
            if (node != null && "array".equals(node.path("type").asText())) {
                return name;
            }
        }
        return null;
    }

    private static int headerRow(List<GridRow> rows) {
        int limit = Math.min(rows.size(), 15);
        for (int i = 0; i < limit; i++) {
            long filled = rows.get(i).cells().stream().filter(c -> c != null && !c.isBlank()).count();
            if (filled >= 2) {
                return i;
            }
        }
        return 0;
    }

    private static Map<Integer, String> matchColumns(
            GridRow header, List<String> fields, Map<String, String> titles) {
        Map<Integer, String> bound = new LinkedHashMap<>();
        for (int i = 0; i < header.cells().size(); i++) {
            String folded = fold(header.cell(i));
            if (folded.isEmpty()) {
                continue;
            }
            for (String field : fields) {
                if (bound.containsValue(field)) {
                    continue;
                }
                if (matchesFold(folded, field) || matchesFold(folded, titles.get(field))) {
                    bound.put(i, field);
                    break;
                }
            }
        }
        return bound;
    }

    private static boolean matchesFold(String headerFold, String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return false;
        }
        String ff = fold(candidate);
        return headerFold.equals(ff) || headerFold.contains(ff) || ff.contains(headerFold);
    }

    static String fold(String raw) {
        if (raw == null) {
            return "";
        }
        String n = Normalizer.normalize(raw, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return n.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "");
    }

    private static void collectScalarFields(
            JsonNode props, List<String> fields, Map<String, String> titles) {
        if (props == null || !props.isObject()) {
            return;
        }
        var names = props.fieldNames();
        while (names.hasNext()) {
            String name = names.next();
            JsonNode node = props.get(name);
            if (node == null) {
                continue;
            }
            if ("array".equals(node.path("type").asText())) {
                collectScalarFields(node.path("items").path("properties"), fields, titles);
                continue;
            }
            if (!fields.contains(name)) {
                fields.add(name);
            }
            JsonNode title = node.path("title");
            if (title.isTextual() && !titles.containsKey(name)) {
                titles.put(name, title.asText());
            }
        }
    }

    record TreeShape(ReadingPlan.Hierarchy hierarchy, List<ReadingPlan.RowClass> rowClasses) {
        static TreeShape fromItemProperties(JsonNode itemProps) {
            String childrenKey = null;
            String leafKey = null;
            List<String> leafFields = new ArrayList<>();
            var names = itemProps.fieldNames();
            while (names.hasNext()) {
                String name = names.next();
                JsonNode node = itemProps.get(name);
                if (node == null || !"array".equals(node.path("type").asText())) {
                    continue;
                }
                JsonNode nestedProps = node.path("items").path("properties");
                boolean nestedHasArray = false;
                if (nestedProps.isObject()) {
                    var nestedNames = nestedProps.fieldNames();
                    while (nestedNames.hasNext()) {
                        JsonNode nested = nestedProps.get(nestedNames.next());
                        if (nested != null && "array".equals(nested.path("type").asText())) {
                            nestedHasArray = true;
                            break;
                        }
                    }
                }
                if (nestedHasArray && childrenKey == null) {
                    childrenKey = name;
                } else if (!nestedHasArray && leafKey == null) {
                    leafKey = name;
                    var leafNames = nestedProps.fieldNames();
                    while (leafNames.hasNext()) {
                        String leafField = leafNames.next();
                        JsonNode leafNode = nestedProps.get(leafField);
                        if (leafNode != null && !"array".equals(leafNode.path("type").asText())) {
                            leafFields.add(leafField);
                        }
                    }
                }
            }
            if (childrenKey == null || leafKey == null) {
                return new TreeShape(
                        ReadingPlan.Hierarchy.NONE,
                        List.of(new ReadingPlan.RowClass("record", "default")));
            }
            List<String> groupScalars = new ArrayList<>();
            var groupNames = itemProps.fieldNames();
            while (groupNames.hasNext()) {
                String name = groupNames.next();
                JsonNode node = itemProps.get(name);
                if (node != null && !"array".equals(node.path("type").asText())) {
                    groupScalars.add(name);
                }
            }
            leafFields.removeIf(groupScalars::contains);
            String signal = "leaf:" + String.join(",", leafFields);
            return new TreeShape(
                    ReadingPlan.Hierarchy.LEARNED,
                    List.of(
                            new ReadingPlan.RowClass(childrenKey, "group"),
                            new ReadingPlan.RowClass(leafKey, signal)));
        }
    }
}
