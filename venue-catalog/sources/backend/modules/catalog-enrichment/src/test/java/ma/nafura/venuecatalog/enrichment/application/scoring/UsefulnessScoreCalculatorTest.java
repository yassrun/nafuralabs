package ma.nafura.venuecatalog.enrichment.application.scoring;

import ma.nafura.venuecatalog.enrichment.application.VenueCatalogEnrichmentProperties;
import ma.nafura.venuecatalog.enrichment.domain.CatalogAppId;
import ma.nafura.venuecatalog.enrichment.domain.EnrichmentModels;
import ma.nafura.venuecatalog.enrichment.domain.UsefulnessDecision;
import ma.nafura.venuecatalog.place.adapter.persistence.CatalogPlaceEntity;
import ma.nafura.venuecatalog.place.domain.CityCode;
import ma.nafura.venuecatalog.place.domain.PlaceStatus;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import ma.nafura.venuecatalog.place.domain.model.PlaceModels;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class UsefulnessScoreCalculatorTest {

    private UsefulnessScoreCalculator calculator;

    @BeforeEach
    void setUp() {
        VenueCatalogEnrichmentProperties properties = new VenueCatalogEnrichmentProperties();
        calculator = new UsefulnessScoreCalculator(properties);
    }

    @Test
    void nightlifeScoresHighForLayali() {
        CatalogPlaceEntity place = basePlace(PrimaryCategory.SOCIAL_VENUE);
        EnrichmentModels.VenueClassification classification = new EnrichmentModels.VenueClassification(
                List.of("NIGHTCLUB", "CABARET"),
                List.of("ROOFTOP"),
                List.of("ALCOHOL"),
                List.of("DANCE", "DJ"),
                List.of("FRIENDS_GROUP"),
                List.of(),
                List.of(),
                0.9,
                0.85,
                List.of("providerTypes"),
                List.of(),
                "KEEP"
        );
        List<EnrichmentModels.AppScore> scores = calculator.compute(place, classification, 3);
        EnrichmentModels.AppScore layali = scores.stream().filter(s -> s.appId() == CatalogAppId.LAYALI).findFirst().orElseThrow();
        assertThat(layali.score()).isGreaterThanOrEqualTo(75);
        assertThat(layali.decision()).isEqualTo(UsefulnessDecision.KEEP);
        assertThat(calculator.globalVerdict(scores)).isEqualTo(UsefulnessDecision.KEEP);
    }

    @Test
    void salonScoresHighForBeautyOnly() {
        CatalogPlaceEntity place = basePlace(PrimaryCategory.BEAUTY);
        EnrichmentModels.VenueClassification classification = new EnrichmentModels.VenueClassification(
                List.of("SALON"),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                0.5,
                0.5,
                List.of(),
                List.of(),
                "REVIEW"
        );
        List<EnrichmentModels.AppScore> scores = calculator.compute(place, classification, 1);
        EnrichmentModels.AppScore beauty = scores.stream().filter(s -> s.appId() == CatalogAppId.BEAUTY).findFirst().orElseThrow();
        EnrichmentModels.AppScore layali = scores.stream().filter(s -> s.appId() == CatalogAppId.LAYALI).findFirst().orElseThrow();
        assertThat(beauty.score()).isGreaterThan(layali.score());
        assertThat(beauty.decision()).isIn(UsefulnessDecision.KEEP, UsefulnessDecision.REVIEW);
        assertThat(layali.decision()).isIn(UsefulnessDecision.REVIEW, UsefulnessDecision.DROP_SUGGESTED);
    }

    private static CatalogPlaceEntity basePlace(PrimaryCategory category) {
        CatalogPlaceEntity place = new CatalogPlaceEntity();
        place.setCanonicalName("Test Venue");
        place.setStatus(PlaceStatus.ENRICHED);
        place.setCountryCode("MA");
        place.setCityCode(CityCode.CASABLANCA);
        place.setPrimaryCategory(category);
        place.setAddress(new PlaceModels.Address("1 rue", "Maarif", null, "Casablanca", "MA"));
        place.setGeo(new PlaceModels.Geo(33.58, -7.63));
        place.setProviderRating(new PlaceModels.ProviderRating(4.5, 200, 3, "OPERATIONAL"));
        place.setQuality(new PlaceModels.PlaceQuality(0.9, 0.8, 0.9, false, List.of()));
        return place;
    }
}
