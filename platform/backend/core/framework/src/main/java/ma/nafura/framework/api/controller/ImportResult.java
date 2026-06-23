package ma.nafura.platform.framework.api.controller;

import java.util.List;

/**
 * Result of a CSV import operation.
 * Reports counts and row-level errors (per-row transactions; failed rows do not roll back others).
 */
public record ImportResult(
    int created,
    int updated,
    int skipped,
    int failed,
    List<ImportError> errors,
    int totalRows
) {
    public ImportResult(int created, int updated, int skipped, int failed, List<ImportError> errors, int totalRows) {
        this.created = created;
        this.updated = updated;
        this.skipped = skipped;
        this.failed = failed;
        this.errors = errors != null ? List.copyOf(errors) : List.of();
        this.totalRows = totalRows;
    }
}
