package ma.nafura.venuecatalog.enrichment.domain;

public enum EnrichmentStepType {
    RESOLVE_DISTRICT,
    APPLY_HARD_FILTERS,
    AI_CLASSIFY,
    COMPUTE_USEFULNESS,
    PERSIST_ENRICHMENT
}
