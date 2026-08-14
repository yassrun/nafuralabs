package ma.nafura.venuecatalog.place.application;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "venue-catalog")
public class VenueCatalogPlaceProperties {

    private Dedupe dedupe = new Dedupe();

    public Dedupe getDedupe() {
        return dedupe;
    }

    public void setDedupe(Dedupe dedupe) {
        this.dedupe = dedupe;
    }

    public static class Dedupe {
        private int geoRoundDecimals = 4;
        private double confidenceReviewThreshold = 0.85;

        public int getGeoRoundDecimals() {
            return geoRoundDecimals;
        }

        public void setGeoRoundDecimals(int geoRoundDecimals) {
            this.geoRoundDecimals = geoRoundDecimals;
        }

        public double getConfidenceReviewThreshold() {
            return confidenceReviewThreshold;
        }

        public void setConfidenceReviewThreshold(double confidenceReviewThreshold) {
            this.confidenceReviewThreshold = confidenceReviewThreshold;
        }
    }
}
