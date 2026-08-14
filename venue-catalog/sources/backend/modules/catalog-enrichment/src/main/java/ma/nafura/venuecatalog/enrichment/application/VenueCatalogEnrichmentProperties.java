package ma.nafura.venuecatalog.enrichment.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "venue-catalog.enrichment")
public class VenueCatalogEnrichmentProperties {

    /** When true, suggestions are stored but never auto-archive/delete places. */
    private boolean shadowMode = true;
    private String promptVersion = "venue-enrich-v1";
    private int batchSize = 30;
    private double keepThreshold = 75.0;
    private double reviewThreshold = 45.0;
    private Weights weights = new Weights();

    public boolean isShadowMode() {
        return shadowMode;
    }

    public void setShadowMode(boolean shadowMode) {
        this.shadowMode = shadowMode;
    }

    public String getPromptVersion() {
        return promptVersion;
    }

    public void setPromptVersion(String promptVersion) {
        this.promptVersion = promptVersion;
    }

    public int getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public double getKeepThreshold() {
        return keepThreshold;
    }

    public void setKeepThreshold(double keepThreshold) {
        this.keepThreshold = keepThreshold;
    }

    public double getReviewThreshold() {
        return reviewThreshold;
    }

    public void setReviewThreshold(double reviewThreshold) {
        this.reviewThreshold = reviewThreshold;
    }

    public Weights getWeights() {
        return weights;
    }

    public void setWeights(Weights weights) {
        this.weights = weights;
    }

    public static class Weights {
        private double dataQuality = 0.20;
        private double popularity = 0.20;
        private double media = 0.10;
        private double freshness = 0.10;
        private double categoryFit = 0.25;
        private double appFit = 0.15;

        public double getDataQuality() { return dataQuality; }
        public void setDataQuality(double dataQuality) { this.dataQuality = dataQuality; }
        public double getPopularity() { return popularity; }
        public void setPopularity(double popularity) { this.popularity = popularity; }
        public double getMedia() { return media; }
        public void setMedia(double media) { this.media = media; }
        public double getFreshness() { return freshness; }
        public void setFreshness(double freshness) { this.freshness = freshness; }
        public double getCategoryFit() { return categoryFit; }
        public void setCategoryFit(double categoryFit) { this.categoryFit = categoryFit; }
        public double getAppFit() { return appFit; }
        public void setAppFit(double appFit) { this.appFit = appFit; }
    }
}
