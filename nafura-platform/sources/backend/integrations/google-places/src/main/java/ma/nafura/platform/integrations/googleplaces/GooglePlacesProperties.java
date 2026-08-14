package ma.nafura.platform.integrations.googleplaces;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "nafura.google-places")
public class GooglePlacesProperties {

    private String apiKey = "";
    private String baseUrl = "https://places.googleapis.com/v1";
    private FieldMasks fieldMasks = new FieldMasks();
    private int maxRetries = 3;
    private long initialBackoffMs = 1000;

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public FieldMasks getFieldMasks() {
        return fieldMasks;
    }

    public void setFieldMasks(FieldMasks fieldMasks) {
        this.fieldMasks = fieldMasks;
    }

    public int getMaxRetries() {
        return maxRetries;
    }

    public void setMaxRetries(int maxRetries) {
        this.maxRetries = maxRetries;
    }

    public long getInitialBackoffMs() {
        return initialBackoffMs;
    }

    public void setInitialBackoffMs(long initialBackoffMs) {
        this.initialBackoffMs = initialBackoffMs;
    }

    public static class FieldMasks {
        private String search = "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.businessStatus";
        private String details = "id,displayName,formattedAddress,addressComponents,location,types,primaryType,businessStatus,nationalPhoneNumber,websiteUri,googleMapsUri,regularOpeningHours,rating,userRatingCount,priceLevel,photos,accessibilityOptions,reservable,servesBeer,servesWine,outdoorSeating,liveMusic";

        public String getSearch() {
            return search;
        }

        public void setSearch(String search) {
            this.search = search;
        }

        public String getDetails() {
            return details;
        }

        public void setDetails(String details) {
            this.details = details;
        }
    }
}
