package ma.nafura.buildintelligence.generation.domain;

public enum GenerationJobStatus {
    QUEUED,
    RUNNING,
    PENDING_APPROVAL,
    APPROVED,
    COMPLETED,
    FAILED
}
