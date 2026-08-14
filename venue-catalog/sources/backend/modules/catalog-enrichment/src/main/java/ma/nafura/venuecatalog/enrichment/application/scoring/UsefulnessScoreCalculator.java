package ma.nafura.venuecatalog.enrichment.application.scoring;

import ma.nafura.venuecatalog.enrichment.application.VenueCatalogEnrichmentProperties;
import ma.nafura.venuecatalog.enrichment.domain.CatalogAppId;
import ma.nafura.venuecatalog.enrichment.domain.EnrichmentModels;
import ma.nafura.venuecatalog.enrichment.domain.UsefulnessDecision;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceEntity;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import ma.nafura.venuecatalog.place.domain.model.PlaceModels;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UsefulnessScoreCalculator {

    private final VenueCatalogEnrichmentProperties properties;

    public UsefulnessScoreCalculator(VenueCatalogEnrichmentProperties properties) {
        this.properties = properties;
    }

    public List<EnrichmentModels.AppScore> compute(
            CatalogPlaceEntity place,
            EnrichmentModels.VenueClassification classification,
            int mediaCount
    ) {
        double dataQuality = clamp01(place.getQuality() == null ? 0.5 : place.getQuality().completenessScore()) * 100;
        double freshness = clamp01(place.getQuality() == null ? 0.5 : place.getQuality().freshnessScore()) * 100;
        double popularity = popularityScore(place.getProviderRating());
        double media = mediaCount <= 0 ? 20 : Math.min(100, 40 + mediaCount * 20);
        double categoryFit = classification == null ? 40 : clamp01(classification.categoryFitScore()) * 100;

        List<EnrichmentModels.AppScore> scores = new ArrayList<>();
        for (CatalogAppId appId : CatalogAppId.values()) {
            double appFit = appFitScore(appId, place.getPrimaryCategory(), classification);
            VenueCatalogEnrichmentProperties.Weights w = properties.getWeights();
            double total =
                    w.getDataQuality() * dataQuality
                            + w.getPopularity() * popularity
                            + w.getMedia() * media
                            + w.getFreshness() * freshness
                            + w.getCategoryFit() * categoryFit
                            + w.getAppFit() * appFit;
            total = Math.round(total * 10.0) / 10.0;
            UsefulnessDecision decision = decide(total);
            List<String> reasons = buildReasons(decision, total, appFit, categoryFit, classification);
            EnrichmentModels.ScoreBreakdown breakdown = new EnrichmentModels.ScoreBreakdown(
                    round(dataQuality), round(popularity), round(media), round(freshness),
                    round(categoryFit), round(appFit), total
            );
            scores.add(new EnrichmentModels.AppScore(appId, total, decision, reasons, breakdown));
        }
        return scores;
    }

    public UsefulnessDecision globalVerdict(List<EnrichmentModels.AppScore> scores) {
        if (scores == null || scores.isEmpty()) {
            return UsefulnessDecision.REVIEW;
        }
        boolean anyKeep = scores.stream().anyMatch(s -> s.decision() == UsefulnessDecision.KEEP);
        boolean allDrop = scores.stream().allMatch(s -> s.decision() == UsefulnessDecision.DROP_SUGGESTED);
        if (anyKeep) {
            return UsefulnessDecision.KEEP;
        }
        if (allDrop) {
            return UsefulnessDecision.DROP_SUGGESTED;
        }
        return UsefulnessDecision.REVIEW;
    }

    private UsefulnessDecision decide(double score) {
        if (score >= properties.getKeepThreshold()) {
            return UsefulnessDecision.KEEP;
        }
        if (score >= properties.getReviewThreshold()) {
            return UsefulnessDecision.REVIEW;
        }
        return UsefulnessDecision.DROP_SUGGESTED;
    }

    private static double popularityScore(PlaceModels.ProviderRating rating) {
        if (rating == null || rating.average() == null) {
            return 35;
        }
        double avg = rating.average();
        int count = rating.count() == null ? 0 : rating.count();
        double base = (avg / 5.0) * 70;
        double volume = Math.min(30, Math.log10(Math.max(1, count) + 1) * 15);
        return Math.min(100, base + volume);
    }

    private static double appFitScore(
            CatalogAppId appId,
            PrimaryCategory category,
            EnrichmentModels.VenueClassification classification
    ) {
        Set<String> venueTypes = venueTypeSet(classification);
        Set<String> offers = facetSet(classification == null ? null : classification.offers());
        Set<String> experiences = facetSet(classification == null ? null : classification.experiences());

        return switch (appId) {
            case LAYALI -> scoreLayali(category, venueTypes, offers, experiences);
            case BEAUTY -> scoreBeauty(category, venueTypes);
            case BLANNER -> scoreBlanner(category, venueTypes, offers);
        };
    }

    private static Set<String> venueTypeSet(EnrichmentModels.VenueClassification classification) {
        if (classification == null || classification.venueTypes() == null || classification.venueTypes().isEmpty()) {
            return Set.of("UNKNOWN");
        }
        return classification.venueTypes().stream()
                .filter(t -> t != null && !t.isBlank())
                .map(t -> t.toUpperCase(Locale.ROOT))
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    private static Set<String> facetSet(List<String> values) {
        if (values == null || values.isEmpty()) {
            return Set.of();
        }
        return values.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(v -> v.toUpperCase(Locale.ROOT))
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    private static double scoreLayali(
            PrimaryCategory category,
            Set<String> venueTypes,
            Set<String> offers,
            Set<String> experiences
    ) {
        Set<String> nightlife = Set.of(
                "BAR", "PUB", "LOUNGE", "SHISHA_LOUNGE", "NIGHTCLUB", "CABARET",
                "LIVE_MUSIC_VENUE", "BEACH_CLUB", "EVENT_VENUE"
        );
        if (venueTypes.stream().anyMatch(nightlife::contains)) {
            return 90;
        }
        if (offers.contains("ALCOHOL") || experiences.contains("DANCE") || experiences.contains("LIVE_MUSIC")
                || experiences.contains("DJ")) {
            return 75;
        }
        if (category == PrimaryCategory.SOCIAL_VENUE
                || venueTypes.contains("RESTAURANT")
                || venueTypes.contains("CAFE")) {
            return 55;
        }
        return 25;
    }

    private static double scoreBeauty(PrimaryCategory category, Set<String> venueTypes) {
        if (category == PrimaryCategory.BEAUTY
                || venueTypes.contains("SALON")
                || venueTypes.contains("BARBERSHOP")
                || venueTypes.contains("SPA")) {
            return 92;
        }
        return 15;
    }

    private static double scoreBlanner(PrimaryCategory category, Set<String> venueTypes, Set<String> offers) {
        if (venueTypes.contains("RESTAURANT")
                || venueTypes.contains("CAFE")
                || venueTypes.contains("TEA_HOUSE")) {
            return 88;
        }
        if (offers.contains("FOOD") || offers.contains("BRUNCH") || offers.contains("COFFEE_TEA")
                || offers.contains("BREAKFAST")) {
            return 70;
        }
        if (category == PrimaryCategory.SOCIAL_VENUE) {
            return 45;
        }
        return 20;
    }

    private static List<String> buildReasons(
            UsefulnessDecision decision,
            double total,
            double appFit,
            double categoryFit,
            EnrichmentModels.VenueClassification classification
    ) {
        List<String> reasons = new ArrayList<>();
        reasons.add("score=" + total);
        reasons.add("appFit=" + round(appFit));
        reasons.add("categoryFit=" + round(categoryFit));
        if (classification != null && classification.venueTypes() != null && !classification.venueTypes().isEmpty()) {
            reasons.add("venueTypes=" + String.join(",", classification.venueTypes()));
        }
        reasons.add("decision=" + decision.name());
        return reasons;
    }

    private static double clamp01(double value) {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    private static double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
