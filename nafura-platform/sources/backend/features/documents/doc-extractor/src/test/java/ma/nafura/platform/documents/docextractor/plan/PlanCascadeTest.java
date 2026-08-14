package ma.nafura.platform.documents.docextractor.plan;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import ma.nafura.platform.documents.docextractor.grid.GridRow;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PlanCascadeTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private PlanCache cache;
    private PlanResolver resolver;
    private GridPlanExecutor executor;

    @BeforeEach
    void setUp() {
        cache = new PlanCache();
        resolver = new PlanResolver(new PlanValidator(), cache);
        executor = new GridPlanExecutor(JSON);
    }

    @Test
    void readingPlanKeepsAnchorsDeclaredAndArrayPathsPlural() {
        ReadingPlan plan = new ReadingPlan(
                "grid",
                List.of(),
                List.of(new ReadingPlan.ColumnBinding(0, "name")),
                List.of(new ReadingPlan.RowClass("record", "default")),
                ReadingPlan.Hierarchy.NONE,
                ReadingPlan.Depivot.RESERVED,
                List.of("items")
        );
        assertThat(plan.anchors()).isEmpty();
        assertThat(plan.arrayPaths()).containsExactly("items");
        assertThat(plan.depivot()).isEqualTo(ReadingPlan.Depivot.RESERVED);
    }

    @Test
    void validatorRejectsEmptyArrayPathsAndEmptyColumns() {
        PlanValidator validator = new PlanValidator();
        ReadingPlan noPaths = new ReadingPlan(
                "grid", List.of(),
                List.of(new ReadingPlan.ColumnBinding(0, "name")),
                List.of(), ReadingPlan.Hierarchy.NONE, ReadingPlan.Depivot.RESERVED, List.of());
        ReadingPlan noCols = new ReadingPlan(
                "grid", List.of(), List.of(), List.of(),
                ReadingPlan.Hierarchy.NONE, ReadingPlan.Depivot.RESERVED, List.of("items"));
        assertThat(validator.validate(noPaths, 2).accepted()).isFalse();
        assertThat(validator.validate(noCols, 2).accepted()).isFalse();
    }

    @Test
    void cacheIsIsolatedPerTenant() {
        ReadingPlan plan = samplePlan();
        cache.put("tenant-a", "fp-1", plan);
        assertThat(cache.get("tenant-a", "fp-1")).contains(plan);
        assertThat(cache.get("tenant-b", "fp-1")).isEmpty();
    }

    @Test
    void fingerprintIgnoresRowCount() {
        List<GridRow> shortGrid = List.of(
                GridRow.of("s", 1, List.of("name", "qty")),
                GridRow.of("s", 2, List.of("a", "1")));
        List<GridRow> longGrid = List.of(
                GridRow.of("s", 1, List.of("name", "qty")),
                GridRow.of("s", 2, List.of("a", "1")),
                GridRow.of("s", 3, List.of("b", "2")));
        assertThat(LayoutFingerprint.of(shortGrid)).isEqualTo(LayoutFingerprint.of(longGrid));
    }

    @Test
    void heuristicThenCacheCascadeUsesSameValidator() throws Exception {
        JsonNode schema = itemsSchema();
        List<GridRow> matching = List.of(
                GridRow.of("s", 1, List.of("name", "qty")),
                GridRow.of("s", 2, List.of("Widget", "2")));
        PlanResolver.Resolved first = resolver.resolve(matching, schema, "t-a").orElseThrow();
        assertThat(first.palier()).isEqualTo(PlanResolver.Palier.HEURISTIC);

        List<GridRow> unmatched = List.of(
                GridRow.of("s", 1, List.of("Libelle", "Quantite")),
                GridRow.of("s", 2, List.of("Widget", "2")));
        assertThat(resolver.resolve(unmatched, schema, "t-a")).isEmpty();

        cache.put("t-a", LayoutFingerprint.of(unmatched), samplePlan());
        PlanResolver.Resolved cached = resolver.resolve(unmatched, schema, "t-a").orElseThrow();
        assertThat(cached.palier()).isEqualTo(PlanResolver.Palier.CACHE);
        assertThat(resolver.resolve(unmatched, schema, "t-b")).isEmpty();
    }

    @Test
    void executorReadsCellsWithoutCallingAnything() throws Exception {
        List<GridRow> rows = List.of(
                GridRow.of("s", 1, List.of("name", "qty")),
                GridRow.of("s", 2, List.of("Widget", "2")));
        JsonNode data = executor.execute(rows, samplePlan());
        assertThat(data.path("items")).hasSize(1);
        assertThat(data.path("items").path(0).path("name").asText()).isEqualTo("Widget");
        assertThat(data.path("items").path(0).path("qty").asText()).isEqualTo("2");
    }

    private static ReadingPlan samplePlan() {
        return new ReadingPlan(
                "grid",
                List.of(),
                List.of(
                        new ReadingPlan.ColumnBinding(0, "name"),
                        new ReadingPlan.ColumnBinding(1, "qty")),
                List.of(new ReadingPlan.RowClass("record", "default")),
                ReadingPlan.Hierarchy.NONE,
                ReadingPlan.Depivot.RESERVED,
                List.of("items"));
    }

    private static JsonNode itemsSchema() throws Exception {
        return JSON.readTree("""
                {
                  "type": "object",
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "name": { "type": "string" },
                          "qty": { "type": "string" }
                        }
                      }
                    }
                  }
                }
                """);
    }
}
