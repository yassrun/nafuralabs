package ma.nafura.platform.documents.docextractor.plan;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

/**
 * Relie un {@link ReadingPlan} au dataSchema. L'import plat est la configuration
 * par défaut du cas complexe — une classe de ligne, pas de hiérarchie.
 */
public final class DefinitionPlanBridge {

    public static final ReadingPlan.RowClass FLAT_ROW_CLASS =
            new ReadingPlan.RowClass("record", "default");

    private DefinitionPlanBridge() {}

    public static ReadingPlan applyFlatDefaults(ReadingPlan plan, JsonNode schema) {
        if (plan == null) {
            return null;
        }
        List<String> paths = plan.arrayPaths().isEmpty()
                ? firstArray(schema)
                : plan.arrayPaths();
        List<ReadingPlan.RowClass> classes = plan.rowClasses().isEmpty()
                ? List.of(FLAT_ROW_CLASS)
                : plan.rowClasses();
        ReadingPlan.Hierarchy hierarchy = plan.hierarchy() == null
                ? ReadingPlan.Hierarchy.NONE
                : plan.hierarchy();
        return new ReadingPlan(
                plan.source(),
                plan.anchors(),
                plan.columns(),
                classes,
                hierarchy,
                ReadingPlan.Depivot.RESERVED,
                paths
        );
    }

    private static List<String> firstArray(JsonNode schema) {
        if (schema == null) {
            return List.of();
        }
        String path = HeuristicPlanFactory.firstArrayPath(schema);
        return path == null ? List.of() : List.of(path);
    }
}
