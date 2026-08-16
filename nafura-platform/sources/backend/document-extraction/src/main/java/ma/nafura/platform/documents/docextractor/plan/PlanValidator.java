package ma.nafura.platform.documents.docextractor.plan;

import java.util.ArrayList;
import java.util.List;

/**
 * Un seul endroit où « le plan est-il acceptable ».
 */
public final class PlanValidator {

    public record Verdict(boolean accepted, List<String> reasons) {
        public static Verdict ok() {
            return new Verdict(true, List.of());
        }

        public static Verdict reject(String reason) {
            return new Verdict(false, List.of(reason));
        }
    }

    public Verdict validate(ReadingPlan plan, int columnCount) {
        if (plan == null) {
            return Verdict.reject("plan_null");
        }
        if (plan.arrayPaths().isEmpty()) {
            return Verdict.reject("array_paths_empty");
        }
        if (plan.columns().isEmpty()) {
            return Verdict.reject("columns_empty");
        }
        if (plan.depivot() != ReadingPlan.Depivot.RESERVED) {
            return Verdict.reject("depivot_unresolved");
        }
        for (ReadingPlan.ColumnBinding col : plan.columns()) {
            if (col == null || col.field() == null || col.field().isBlank()) {
                return Verdict.reject("column_field_blank");
            }
            if (col.index() < 0 || (columnCount > 0 && col.index() >= columnCount)) {
                return Verdict.reject("column_index_out_of_range");
            }
        }
        return Verdict.ok();
    }
}
