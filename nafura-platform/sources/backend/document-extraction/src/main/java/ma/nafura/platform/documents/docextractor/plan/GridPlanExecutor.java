package ma.nafura.platform.documents.docextractor.plan;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import ma.nafura.platform.documents.docextractor.grid.GridRow;

/**
 * Exécute un plan sur une grille. Déterministe — aucun appel.
 */
public final class GridPlanExecutor {

    private final ObjectMapper objectMapper;

    public GridPlanExecutor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public JsonNode execute(List<GridRow> rows, ReadingPlan plan) {
        if (plan.hierarchy() == ReadingPlan.Hierarchy.LEARNED) {
            return executeLearned(rows, plan);
        }
        return executeFlat(rows, plan);
    }

    private JsonNode executeFlat(List<GridRow> rows, ReadingPlan plan) {
        ObjectNode root = objectMapper.createObjectNode();
        String arrayPath = plan.arrayPaths().get(0);
        ArrayNode array = objectMapper.createArrayNode();
        int start = skipHeader(rows);
        for (int i = start; i < rows.size(); i++) {
            GridRow row = rows.get(i);
            if (row.isEmpty()) {
                continue;
            }
            ObjectNode obj = mapRow(row, plan);
            if (obj.size() > 0) {
                array.add(obj);
            }
        }
        root.set(arrayPath, array);
        return root;
    }

    private JsonNode executeLearned(List<GridRow> rows, ReadingPlan plan) {
        String childrenKey = "children";
        String leafKey = "postes";
        List<String> leafFields = List.of();
        for (ReadingPlan.RowClass rowClass : plan.rowClasses()) {
            if ("group".equals(rowClass.signal())) {
                childrenKey = rowClass.name();
            } else if (rowClass.signal() != null && rowClass.signal().startsWith("leaf:")) {
                leafKey = rowClass.name();
                String spec = rowClass.signal().substring("leaf:".length());
                leafFields = spec.isBlank() ? List.of() : List.of(spec.split(","));
            }
        }
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode lots = objectMapper.createArrayNode();
        root.set(plan.arrayPaths().get(0), lots);
        Deque<Frame> stack = new ArrayDeque<>();
        int start = skipHeader(rows);
        for (int i = start; i < rows.size(); i++) {
            GridRow row = rows.get(i);
            if (row.isEmpty()) {
                continue;
            }
            ObjectNode mapped = mapRow(row, plan);
            if (mapped.size() == 0) {
                continue;
            }
            boolean leaf = isLeaf(mapped, leafFields);
            int depth = row.firstFilledColumn();
            if (leaf) {
                ObjectNode parent = ensureGroup(stack, lots, childrenKey, leafKey, 0);
                arrayOf(parent, leafKey).add(mapped);
                continue;
            }
            while (!stack.isEmpty() && stack.peek().depth >= depth) {
                stack.pop();
            }
            ObjectNode group = mapped.deepCopy();
            group.set(childrenKey, objectMapper.createArrayNode());
            group.set(leafKey, objectMapper.createArrayNode());
            if (stack.isEmpty()) {
                lots.add(group);
            } else {
                arrayOf(stack.peek().node, childrenKey).add(group);
            }
            stack.push(new Frame(group, depth));
        }
        return root;
    }

    private static int skipHeader(List<GridRow> rows) {
        int start = 0;
        while (start < rows.size()) {
            GridRow row = rows.get(start);
            long filled = row.cells().stream().filter(c -> c != null && !c.isBlank()).count();
            start++;
            if (filled >= 2) {
                break;
            }
        }
        return start;
    }

    private ObjectNode mapRow(GridRow row, ReadingPlan plan) {
        ObjectNode obj = objectMapper.createObjectNode();
        for (ReadingPlan.ColumnBinding col : plan.columns()) {
            String value = row.cell(col.index());
            if (!value.isBlank()) {
                obj.put(col.field(), value);
            }
        }
        return obj;
    }

    private static boolean isLeaf(ObjectNode mapped, List<String> leafFields) {
        for (String field : leafFields) {
            JsonNode value = mapped.get(field);
            if (value != null && value.isTextual() && !value.asText().isBlank()) {
                return true;
            }
        }
        return false;
    }

    private ObjectNode ensureGroup(
            Deque<Frame> stack, ArrayNode lots, String childrenKey, String leafKey, int depth) {
        if (!stack.isEmpty()) {
            return stack.peek().node;
        }
        ObjectNode group = objectMapper.createObjectNode();
        group.put("designation", "");
        group.set(childrenKey, objectMapper.createArrayNode());
        group.set(leafKey, objectMapper.createArrayNode());
        lots.add(group);
        stack.push(new Frame(group, depth));
        return group;
    }

    private static ArrayNode arrayOf(ObjectNode node, String key) {
        JsonNode existing = node.get(key);
        if (existing instanceof ArrayNode array) {
            return array;
        }
        throw new IllegalStateException("expected array at " + key);
    }

    private record Frame(ObjectNode node, int depth) {}
}
