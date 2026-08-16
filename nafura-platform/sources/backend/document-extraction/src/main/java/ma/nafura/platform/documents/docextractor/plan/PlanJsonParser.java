package ma.nafura.platform.documents.docextractor.plan;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Désérialise un plan compilé par l'IA. Strict sur colonnes et arrayPaths ; le reste a des défauts.
 */
public final class PlanJsonParser {

    private PlanJsonParser() {}

    public static Optional<ReadingPlan> parse(JsonNode node) {
        if (node == null || !node.isObject()) {
            return Optional.empty();
        }
        List<ReadingPlan.ColumnBinding> columns = new ArrayList<>();
        JsonNode cols = node.path("columns");
        if (!cols.isArray()) {
            return Optional.empty();
        }
        for (JsonNode col : cols) {
            if (!col.has("index") || !col.has("field")) {
                return Optional.empty();
            }
            columns.add(new ReadingPlan.ColumnBinding(col.path("index").asInt(), col.path("field").asText()));
        }
        List<String> arrayPaths = new ArrayList<>();
        JsonNode paths = node.path("arrayPaths");
        if (paths.isArray()) {
            for (JsonNode p : paths) {
                if (p.isTextual() && !p.asText().isBlank()) {
                    arrayPaths.add(p.asText());
                }
            }
        }
        List<ReadingPlan.Anchor> anchors = new ArrayList<>();
        JsonNode anchorsNode = node.path("anchors");
        if (anchorsNode.isArray()) {
            for (JsonNode a : anchorsNode) {
                String label = a.path("label").asText("");
                String field = a.path("field").asText("");
                if (!label.isBlank() && !field.isBlank()) {
                    anchors.add(new ReadingPlan.Anchor(label, field));
                }
            }
        }
        List<ReadingPlan.RowClass> rowClasses = new ArrayList<>();
        JsonNode classes = node.path("rowClasses");
        if (classes.isArray()) {
            for (JsonNode c : classes) {
                String name = c.path("name").asText("");
                if (!name.isBlank()) {
                    rowClasses.add(new ReadingPlan.RowClass(name, c.path("signal").asText("")));
                }
            }
        }
        ReadingPlan.Hierarchy hierarchy = "LEARNED".equalsIgnoreCase(node.path("hierarchy").asText())
                ? ReadingPlan.Hierarchy.LEARNED
                : ReadingPlan.Hierarchy.NONE;
        return Optional.of(new ReadingPlan(
                node.path("source").asText("grid"),
                anchors,
                columns,
                rowClasses,
                hierarchy,
                ReadingPlan.Depivot.RESERVED,
                arrayPaths
        ));
    }
}
