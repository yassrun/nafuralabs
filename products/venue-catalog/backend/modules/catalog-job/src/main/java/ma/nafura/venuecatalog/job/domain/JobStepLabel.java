package ma.nafura.venuecatalog.job.domain;

public enum JobStepLabel {
    SEARCH_PROVIDER,
    FETCH_DETAILS,
    SYNC_MEDIA,
    UPSERT_PLACES,
    RESOLVE_DISTRICT,
    APPLY_HARD_FILTERS,
    AI_CLASSIFY,
    COMPUTE_USEFULNESS,
    PERSIST_ENRICHMENT
}
