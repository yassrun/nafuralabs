package ma.nafura.platform.documents.docextractor.api.response;

/**
 * A single validation issue on an extracted field or array row.
 */
public record FieldIssueDto(
        String path,
        Integer rowIndex,
        FieldIssueKind kind,
        String message,
        DoubtNature nature
) {
    public FieldIssueDto {
        nature = nature == null ? DoubtNature.fromKind(kind) : nature;
    }

    public FieldIssueDto(String path, Integer rowIndex, FieldIssueKind kind, String message) {
        this(path, rowIndex, kind, message, DoubtNature.fromKind(kind));
    }
}
