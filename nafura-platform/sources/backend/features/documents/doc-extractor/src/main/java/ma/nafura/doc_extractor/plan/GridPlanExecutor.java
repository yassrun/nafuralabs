package ma.nafura.platform.documents.docextractor.plan;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
        ObjectNode root = objectMapper.createObjectNode();
        String arrayPath = plan.arrayPaths().get(0);
        ArrayNode array = objectMapper.createArrayNode();
        int start = 0;
        while (start < rows.size()) {
            GridRow row = rows.get(start);
            long filled = row.cells().stream().filter(c -> c != null && !c.isBlank()).count();
            start++;
            if (filled >= 2) {
                break;
            }
        }
        for (int i = start; i < rows.size(); i++) {
            GridRow row = rows.get(i);
            if (row.isEmpty()) {
                continue;
            }
            ObjectNode obj = objectMapper.createObjectNode();
            boolean any = false;
            for (ReadingPlan.ColumnBinding col : plan.columns()) {
                String value = row.cell(col.index());
                if (!value.isBlank()) {
                    obj.put(col.field(), value);
                    any = true;
                }
            }
            if (any) {
                array.add(obj);
            }
        }
        root.set(arrayPath, array);
        return root;
    }
}
