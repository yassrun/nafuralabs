package ma.nafura.platform.integrations.googleplaces;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class HttpGooglePlacesClient implements GooglePlacesClient {

    private static final Logger log = LoggerFactory.getLogger(HttpGooglePlacesClient.class);

    private final RestClient restClient;
    private final GooglePlacesProperties properties;
    private final ObjectMapper objectMapper;

    public HttpGooglePlacesClient(GooglePlacesProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("X-Goog-Api-Key", properties.getApiKey())
                .build();
    }

    @Override
    public PlaceSearchResult searchText(TextSearchRequest request, String fieldMask) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("textQuery", request.textQuery());
        if (request.regionCode() != null) {
            body.put("regionCode", request.regionCode());
        }
        if (request.maxResultCount() != null) {
            body.put("maxResultCount", request.maxResultCount());
        }
        if (request.latitude() != null && request.longitude() != null) {
            ObjectNode bias = body.putObject("locationBias");
            ObjectNode circle = bias.putObject("circle");
            ObjectNode center = circle.putObject("center");
            center.put("latitude", request.latitude());
            center.put("longitude", request.longitude());
            circle.put("radius", 5000.0);
        }
        JsonNode response = postWithRetry("/places:searchText", body, fieldMask);
        return parseSearchResult(response);
    }

    @Override
    public PlaceSearchResult searchNearby(NearbySearchRequest request, String fieldMask) {
        ObjectNode body = objectMapper.createObjectNode();
        ArrayNode types = body.putArray("includedTypes");
        types.add("restaurant");
        types.add("bar");
        types.add("night_club");
        ObjectNode circle = body.putObject("locationRestriction").putObject("circle");
        ObjectNode center = circle.putObject("center");
        center.put("latitude", request.latitude());
        center.put("longitude", request.longitude());
        circle.put("radius", (double) request.radiusMeters());
        if (request.maxResultCount() != null) {
            body.put("maxResultCount", request.maxResultCount());
        }
        JsonNode response = postWithRetry("/places:searchNearby", body, fieldMask);
        return parseSearchResult(response);
    }

    @Override
    public PlaceDetails getPlaceDetails(String placeId, String fieldMask) {
        String resource = placeId.startsWith("places/") ? placeId : "places/" + placeId;
        JsonNode response = getWithRetry("/" + resource, fieldMask);
        return parsePlaceDetails(response);
    }

    @Override
    public byte[] fetchPlacePhoto(String photoResourceName, int maxWidthPx) {
        String resource = photoResourceName.startsWith("places/") ? photoResourceName : photoResourceName;
        int attempts = 0;
        long backoff = properties.getInitialBackoffMs();
        while (true) {
            attempts++;
            try {
                return restClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/{photo}/media")
                                .queryParam("maxWidthPx", maxWidthPx)
                                .build(resource))
                        .header("X-Goog-FieldMask", "photoUri")
                        .header("X-Goog-Api-Key", properties.getApiKey())
                        .retrieve()
                        .body(byte[].class);
            } catch (RestClientResponseException ex) {
                if (attempts >= properties.getMaxRetries() || !isRetryable(ex.getStatusCode().value())) {
                    throw toException(ex);
                }
                sleep(backoff);
                backoff *= 2;
            } catch (Exception ex) {
                throw new GooglePlacesException("Failed to fetch place photo", ex);
            }
        }
    }

    private JsonNode postWithRetry(String path, ObjectNode body, String fieldMask) {
        int attempts = 0;
        long backoff = properties.getInitialBackoffMs();
        while (true) {
            attempts++;
            try {
                return restClient.post()
                        .uri(path)
                        .header("X-Goog-FieldMask", fieldMask)
                        .body(body)
                        .retrieve()
                        .body(JsonNode.class);
            } catch (RestClientResponseException ex) {
                if (attempts >= properties.getMaxRetries() || !isRetryable(ex.getStatusCode().value())) {
                    throw toException(ex);
                }
                log.warn("Google Places retry {} for POST {}: {}", attempts, path, ex.getMessage());
                sleep(backoff);
                backoff *= 2;
            }
        }
    }

    private JsonNode getWithRetry(String path, String fieldMask) {
        int attempts = 0;
        long backoff = properties.getInitialBackoffMs();
        while (true) {
            attempts++;
            try {
                return restClient.get()
                        .uri(path)
                        .header("X-Goog-FieldMask", fieldMask)
                        .retrieve()
                        .body(JsonNode.class);
            } catch (RestClientResponseException ex) {
                if (attempts >= properties.getMaxRetries() || !isRetryable(ex.getStatusCode().value())) {
                    throw toException(ex);
                }
                log.warn("Google Places retry {} for GET {}: {}", attempts, path, ex.getMessage());
                sleep(backoff);
                backoff *= 2;
            }
        }
    }

    private static boolean isRetryable(int status) {
        return status == 429 || status >= 500;
    }

    private static GooglePlacesException toException(RestClientResponseException ex) {
        int status = ex.getStatusCode().value();
        boolean retryable = isRetryable(status);
        return new GooglePlacesException(ex.getResponseBodyAsString(), status, retryable);
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new GooglePlacesException("Interrupted during Google Places backoff", e);
        }
    }

    private PlaceSearchResult parseSearchResult(JsonNode response) {
        if (response == null) {
            return new PlaceSearchResult(List.of(), null);
        }
        List<PlaceSearchHit> hits = new ArrayList<>();
        JsonNode places = response.path("places");
        if (places.isArray()) {
            places.forEach(node -> hits.add(parseSearchHit(node)));
        }
        String nextPageToken = textOrNull(response, "nextPageToken");
        return new PlaceSearchResult(hits, nextPageToken);
    }

    private PlaceSearchHit parseSearchHit(JsonNode node) {
        return new PlaceSearchHit(
                textOrNull(node, "id"),
                parseLocalizedText(node.path("displayName")),
                textOrNull(node, "formattedAddress"),
                parseGeo(node.path("location")),
                parseStringList(node.path("types")),
                textOrNull(node, "primaryType"),
                textOrNull(node, "businessStatus")
        );
    }

    private PlaceDetails parsePlaceDetails(JsonNode node) {
        PlaceDetails.AccessibilityOptions accessibility = null;
        JsonNode acc = node.path("accessibilityOptions");
        if (!acc.isMissingNode()) {
            accessibility = new PlaceDetails.AccessibilityOptions(
                    acc.path("wheelchairAccessibleEntrance").asBoolean(false));
        }
        return new PlaceDetails(
                textOrNull(node, "id"),
                parseLocalizedText(node.path("displayName")),
                textOrNull(node, "formattedAddress"),
                parseAddressComponents(node.path("addressComponents")),
                parseGeo(node.path("location")),
                parseStringList(node.path("types")),
                textOrNull(node, "primaryType"),
                textOrNull(node, "businessStatus"),
                textOrNull(node, "nationalPhoneNumber"),
                textOrNull(node, "websiteUri"),
                textOrNull(node, "googleMapsUri"),
                parseOpeningHours(node.path("regularOpeningHours")),
                node.path("rating").isNumber() ? node.path("rating").asDouble() : null,
                node.path("userRatingCount").isInt() ? node.path("userRatingCount").asInt() : null,
                textOrNull(node, "priceLevel"),
                parsePhotos(node.path("photos")),
                node.path("reservable").isBoolean() ? node.path("reservable").asBoolean() : null,
                node.path("servesBeer").isBoolean() ? node.path("servesBeer").asBoolean() : null,
                node.path("servesWine").isBoolean() ? node.path("servesWine").asBoolean() : null,
                node.path("outdoorSeating").isBoolean() ? node.path("outdoorSeating").asBoolean() : null,
                node.path("liveMusic").isBoolean() ? node.path("liveMusic").asBoolean() : null,
                accessibility
        );
    }

    private static LocalizedText parseLocalizedText(JsonNode node) {
        if (node.isMissingNode()) {
            return new LocalizedText(null, null);
        }
        return new LocalizedText(textOrNull(node, "text"), textOrNull(node, "languageCode"));
    }

    private static GeoPoint parseGeo(JsonNode node) {
        if (node.isMissingNode()) {
            return new GeoPoint(0, 0);
        }
        return new GeoPoint(node.path("latitude").asDouble(), node.path("longitude").asDouble());
    }

    private static List<String> parseStringList(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        node.forEach(item -> values.add(item.asText()));
        return values;
    }

    private static List<AddressComponent> parseAddressComponents(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<AddressComponent> components = new ArrayList<>();
        node.forEach(item -> components.add(new AddressComponent(
                textOrNull(item, "longText"),
                textOrNull(item, "shortText"),
                parseStringList(item.path("types"))
        )));
        return components;
    }

    private static RegularOpeningHours parseOpeningHours(JsonNode node) {
        if (node.isMissingNode()) {
            return null;
        }
        List<OpeningHoursPeriod> periods = new ArrayList<>();
        JsonNode periodNodes = node.path("periods");
        if (periodNodes.isArray()) {
            periodNodes.forEach(period -> {
                JsonNode open = period.path("open");
                JsonNode close = period.path("close");
                periods.add(new OpeningHoursPeriod(
                        textOrNull(open, "day"),
                        textOrNull(open, "hour") != null ? open.path("hour").asText() + ":" + String.format("%02d", open.path("minute").asInt()) : null,
                        textOrNull(close, "day"),
                        textOrNull(close, "hour") != null ? close.path("hour").asText() + ":" + String.format("%02d", close.path("minute").asInt()) : null
                ));
            });
        }
        return new RegularOpeningHours(periods, parseStringList(node.path("weekdayDescriptions")));
    }

    private static List<PlacePhotoRef> parsePhotos(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<PlacePhotoRef> photos = new ArrayList<>();
        node.forEach(item -> photos.add(new PlacePhotoRef(
                textOrNull(item, "name"),
                item.path("widthPx").asInt(0),
                item.path("heightPx").asInt(0),
                parseStringList(item.path("authorAttributions"))
        )));
        return photos;
    }

    private static String textOrNull(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        return value.asText();
    }
}
