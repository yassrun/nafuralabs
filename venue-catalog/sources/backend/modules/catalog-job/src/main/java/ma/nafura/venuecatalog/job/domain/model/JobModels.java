package ma.nafura.venuecatalog.job.domain.model;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class JobModels {

    private JobModels() {}

    public record JobRequest(
            String mode,
            Map<String, Object> query,
            Map<String, Object> options,
            List<UUID> catalogPlaceIds,
            Boolean refreshMedia,
            Boolean refreshHours
    ) {}

    public record JobResult(
            int candidatesFound,
            int created,
            int updated,
            int archivedDuplicates,
            int skipped,
            int mappingsAffected
    ) {}

    public record JobProgress(int current, int total, String stepLabel) {}

    public record JobError(String code, String message, boolean retryable) {}
}
