package ma.nafura.etudes.api.response;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.domain.dossier.DocumentExtractionJob;

/** Vue API d'un job d'extraction asynchrone. */
public record ExtractionJobDto(
        UUID id,
        UUID dossierEtudeId,
        UUID dossierDocumentId,
        String jobType,
        String status,
        int progressPercent,
        String progressStep,
        Map<String, Object> result,
        String errorCode,
        String errorMessage,
        int attemptCount,
        int maxAttempts,
        OffsetDateTime createdAt,
        OffsetDateTime startedAt,
        OffsetDateTime finishedAt) {

    public static ExtractionJobDto from(DocumentExtractionJob job) {
        return new ExtractionJobDto(
                job.getId(),
                job.getDossierEtudeId(),
                job.getDossierDocumentId(),
                job.getJobType(),
                job.getStatus(),
                job.getProgressPercent() != null ? job.getProgressPercent() : 0,
                job.getProgressStep(),
                job.getResultJson(),
                job.getErrorCode(),
                job.getErrorMessage(),
                job.getAttemptCount() != null ? job.getAttemptCount() : 0,
                job.getMaxAttempts() != null ? job.getMaxAttempts() : 3,
                job.getCreatedAt(),
                job.getStartedAt(),
                job.getFinishedAt());
    }
}
