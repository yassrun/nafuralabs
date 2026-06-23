package ma.nafura.venuecatalog.place.application;

import ma.nafura.venuecatalog.place.domain.CityCode;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import ma.nafura.venuecatalog.place.domain.model.PlaceModels;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PlaceNormalizationServiceTest {

    private final PlaceNormalizationService service = new PlaceNormalizationService();

    @Test
    void normalizeNameCollapsesWhitespace() {
        assertEquals("sky 28 casablanca", service.normalizeName("  Sky   28   Casablanca "));
    }

    @Test
    void roundGeoUsesConfiguredPrecision() {
        PlaceModels.Geo rounded = service.roundGeo(new PlaceModels.Geo(33.58723456, -7.63209876), 4);
        assertEquals(33.5872, rounded.lat(), 0.0001);
        assertEquals(-7.6321, rounded.lng(), 0.0001);
    }

    @Test
    void mapCategoryUsesGooglePrimaryType() {
        PrimaryCategory category = service.mapCategory(List.of("bar", "restaurant"), "night_club", null);
        assertEquals(PrimaryCategory.NIGHTLIFE_VENUE, category);
    }

    @Test
    void computeQualityFlagsManualReviewWhenConfidenceLow() {
        PlaceModels.PlaceQuality quality = service.computeQuality(
                new PlaceModels.Address("line", null, null, CityCode.CASABLANCA.name(), "MA"),
                new PlaceModels.Geo(33.5, -7.6),
                null,
                PrimaryCategory.OTHER,
                List.of(),
                0.85
        );
        assertTrue(quality.manualReviewRequired());
    }

    @Test
    void computeQualityPassesWhenComplete() {
        PlaceModels.PlaceQuality quality = service.computeQuality(
                new PlaceModels.Address("line", null, null, CityCode.CASABLANCA.name(), "MA"),
                new PlaceModels.Geo(33.5, -7.6),
                new PlaceModels.Contact("+212600000000", "https://example.com", null),
                PrimaryCategory.NIGHTLIFE_VENUE,
                List.of(),
                0.85
        );
        assertFalse(quality.manualReviewRequired());
        assertTrue(quality.completenessScore() >= 0.7);
    }
}
