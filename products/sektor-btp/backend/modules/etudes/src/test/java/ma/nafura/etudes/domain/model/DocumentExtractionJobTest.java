package ma.nafura.etudes.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class DocumentExtractionJobTest {

    @Test
    void estTerminal_coversSucceededFailedCancelled() {
        DocumentExtractionJob job = DocumentExtractionJob.builder()
                .status(DocumentExtractionJob.STATUS_QUEUED)
                .build();
        assertThat(job.estTerminal()).isFalse();

        job.setStatus(DocumentExtractionJob.STATUS_SUCCEEDED);
        assertThat(job.estTerminal()).isTrue();
        assertThat(job.peutRelancer()).isFalse();

        job.setStatus(DocumentExtractionJob.STATUS_FAILED);
        assertThat(job.peutRelancer()).isTrue();
    }

    @Test
    void onCreate_setsDefaults() {
        DocumentExtractionJob job = new DocumentExtractionJob();
        job.onCreate();
        assertThat(job.getStatus()).isEqualTo(DocumentExtractionJob.STATUS_QUEUED);
        assertThat(job.getProgressPercent()).isZero();
        assertThat(job.getAttemptCount()).isZero();
        assertThat(job.getMaxAttempts()).isEqualTo(3);
        assertThat(job.getExtractorVersion()).isEqualTo(DocumentExtractionJob.EXTRACTOR_VERSION);
        assertThat(job.getCreatedAt()).isNotNull();
        assertThat(job.getAvailableAt()).isNotNull();
    }
}
