package ma.nafura.platform.framework.record;

import java.util.List;

/**
 * A typed property of a record, declared in its descriptor.
 * {@code type} is {@code text}, {@code number}, {@code money}, {@code date}, {@code boolean},
 * {@code status}, {@code select}, {@code relation} (N-1, a UUID field towards {@code target}),
 * {@code relations} (1-N, the {@code target} records whose {@code via} field points here — no field of its own)
 * or {@code person}. {@code currency}: optional code shown next to a {@code money}.
 */
public record RecordProperty(
        String key,
        String label,
        String type,
        boolean filterable,
        boolean sortable,
        String target,
        String display,
        String via,
        String currency,
        List<String> options) {

    public boolean isRelation() {
        return "relation".equals(type) || "relations".equals(type);
    }
}
