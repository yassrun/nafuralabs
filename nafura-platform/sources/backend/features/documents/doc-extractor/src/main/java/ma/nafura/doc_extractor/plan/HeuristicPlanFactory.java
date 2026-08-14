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
        itemProps.fieldNames().forEachRemaining(fields::add);
        if (fields.isEmpty()) {
            return Optional.empty();
        }

        int headerIndex = headerRow(rows);
        GridRow header = headerIndex >= 0 ? rows.get(headerIndex) : rows.get(0);
        Map<Integer, String> bindings = matchColumns(header, fields);
        if (bindings.isEmpty()) {
            return Optional.empty();
        }
        List<ReadingPlan.ColumnBinding> columns = new ArrayList<>();
        bindings.forEach((index, field) -> columns.add(new ReadingPlan.ColumnBinding(index, field)));
        return Optional.of(new ReadingPlan(
                "grid:" + header.page(),
                List.of(),
                columns,
                List.of(new ReadingPlan.RowClass("record", "default")),
                ReadingPlan.Hierarchy.NONE,
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

    private static Map<Integer, String> matchColumns(GridRow header, List<String> fields) {
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
                String ff = fold(field);
                if (folded.equals(ff) || folded.contains(ff) || ff.contains(folded)) {
                    bound.put(i, field);
                    break;
                }
            }
        }
        return bound;
    }

    static String fold(String raw) {
        if (raw == null) {
            return "";
        }
        String n = Normalizer.normalize(raw, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return n.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "");
    }
}
