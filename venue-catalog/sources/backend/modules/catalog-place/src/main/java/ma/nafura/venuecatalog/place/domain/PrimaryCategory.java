package ma.nafura.venuecatalog.place.domain;

/**
 * Coarse parent category. Fine formats live in {@code venueTypes[]}.
 * v1 product buckets: social venues (dining + nightlife) vs beauty.
 */
public enum PrimaryCategory {
    SOCIAL_VENUE,
    BEAUTY,
    OTHER
}
