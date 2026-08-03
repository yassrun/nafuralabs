package ma.nafura.platform.geo.district;

/**
 * Versioned Morocco operational-zone catalog (non-tenant, static).
 * Not related to the legacy tenant-scoped JPA stubs under ma.nafura.geo.domain.model.
 */
public record GeoReferenceVersion(
        String version,
        String cityCode,
        String cityLabel,
        String provenance,
        String effectiveFrom
) {}
