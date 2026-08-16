package ma.nafura.platform.documents.docextractor.plan;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Optional;
import ma.nafura.platform.documents.docextractor.grid.GridRow;
import org.springframework.stereotype.Component;

/**
 * Cascade : heuristique → cache → ia compile → vision.
 * Paliers 1–2 ici ; 3–4 chez l'appelant, via {@link #accept} après le même validateur.
 */
@Component
public class PlanResolver {

    public enum Palier {
        HEURISTIC,
        CACHE,
        IA,
        VISION
    }

    public record Resolved(ReadingPlan plan, Palier palier) {}

    private final PlanValidator validator;
    private final PlanCache cache;

    public PlanResolver(PlanValidator validator, PlanCache cache) {
        this.validator = validator;
        this.cache = cache;
    }

    public Optional<Resolved> resolve(List<GridRow> rows, JsonNode schema, String tenantId) {
        if (rows == null || rows.isEmpty()) {
            return Optional.empty();
        }
        int columns = columnCount(rows);
        String fingerprint = LayoutFingerprint.of(rows);

        Optional<ReadingPlan> heuristic = HeuristicPlanFactory.fromGrid(rows, schema);
        if (heuristic.isPresent()) {
            ReadingPlan candidate = DefinitionPlanBridge.applyFlatDefaults(heuristic.get(), schema);
            if (validator.validate(candidate, columns).accepted()) {
                cache.put(tenantId, fingerprint, candidate);
                return Optional.of(new Resolved(candidate, Palier.HEURISTIC));
            }
        }

        Optional<ReadingPlan> cached = cache.get(tenantId, fingerprint);
        if (cached.isPresent()) {
            ReadingPlan candidate = DefinitionPlanBridge.applyFlatDefaults(cached.get(), schema);
            if (validator.validate(candidate, columns).accepted()) {
                return Optional.of(new Resolved(candidate, Palier.CACHE));
            }
        }

        return Optional.empty();
    }

    /**
     * Paliers 3–4 : le plan compilé n'est retenu que s'il passe le même validateur.
     */
    public Optional<Resolved> accept(String tenantId, List<GridRow> rows, ReadingPlan plan, Palier palier) {
        if (rows == null || rows.isEmpty() || plan == null) {
            return Optional.empty();
        }
        if (palier != Palier.IA && palier != Palier.VISION) {
            return Optional.empty();
        }
        ReadingPlan candidate = DefinitionPlanBridge.applyFlatDefaults(plan, null);
        int columns = columnCount(rows);
        if (!validator.validate(candidate, columns).accepted()) {
            return Optional.empty();
        }
        cache.put(tenantId, LayoutFingerprint.of(rows), candidate);
        return Optional.of(new Resolved(candidate, palier));
    }

    static int columnCount(List<GridRow> rows) {
        return rows.stream().mapToInt(r -> r.cells().size()).max().orElse(0);
    }
}
