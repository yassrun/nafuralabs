package ma.nafura.venuecatalog.enrichment.domain;

import ma.nafura.venuecatalog.place.domain.taxonomy.VenueMaTaxonomyV0;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class EnrichmentModels {

    private EnrichmentModels() {}

    public record VenueClassification(
            List<String> venueTypes,
            List<String> settings,
            List<String> offers,
            List<String> experiences,
            List<String> suitableFor,
            List<String> musicStyles,
            List<String> cuisines,
            double categoryFitScore,
            double confidence,
            List<String> evidenceFields,
            List<String> warnings,
            String selectionSuggestion
    ) {
        public String primaryVenueType() {
            if (venueTypes == null || venueTypes.isEmpty()) {
                return "UNKNOWN";
            }
            return venueTypes.get(0);
        }

        /** Denormalized offers ∪ experiences for legacy consumers. */
        public List<String> activities() {
            return VenueMaTaxonomyV0.mergeFacetLists(offers, experiences);
        }
    }

    public record ScoreBreakdown(
            double dataQuality,
            double popularity,
            double media,
            double freshness,
            double categoryFit,
            double appFit,
            double total
    ) {}

    public record AppScore(
            CatalogAppId appId,
            double score,
            UsefulnessDecision decision,
            List<String> reasons,
            ScoreBreakdown breakdown
    ) {}

    public record PlaceEnrichmentSnapshot(
            UUID placeId,
            String districtCode,
            String districtLabel,
            String geoMethod,
            Double geoConfidence,
            String geoReferenceVersion,
            boolean geoNeedsReview,
            List<String> venueTypes,
            String venueType,
            List<String> settings,
            List<String> offers,
            List<String> experiences,
            List<String> suitableFor,
            List<String> activities,
            List<String> musicStyles,
            List<String> cuisines,
            Double confidence,
            String selectionSuggestion,
            FilterDecision filterDecision,
            UsefulnessDecision verdict,
            Double categoryFitScore,
            List<AppScore> appScores,
            List<String> evidenceFields,
            List<String> warnings,
            String enrichmentStatus,
            boolean manualOverride,
            String manualOverrideAt,
            String manualOverrideBy
    ) {}

    public record ManualTaxonomyOverride(
            List<String> venueTypes,
            List<String> settings,
            List<String> offers,
            List<String> experiences,
            List<String> suitableFor,
            List<String> musicStyles,
            List<String> cuisines,
            Boolean servesAlcohol,
            String verdict
    ) {}

    public record PipelinePlaceResult(
            UUID placeId,
            boolean success,
            boolean partial,
            String lastStep,
            String errorCode,
            String errorMessage,
            boolean retryable,
            Map<String, Object> details
    ) {}
}
