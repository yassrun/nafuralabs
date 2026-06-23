package ma.nafura.venuecatalog.source.adapter;

import ma.nafura.platform.integrations.googleplaces.GooglePlacesClient;
import ma.nafura.platform.integrations.googleplaces.GooglePlacesProperties;
import ma.nafura.platform.integrations.googleplaces.NearbySearchRequest;
import ma.nafura.platform.integrations.googleplaces.PlaceDetails;
import ma.nafura.platform.integrations.googleplaces.PlaceSearchResult;
import ma.nafura.platform.integrations.googleplaces.TextSearchRequest;
import ma.nafura.venuecatalog.place.domain.CityCode;
import org.springframework.stereotype.Component;

@Component
public class GooglePlacesAdapter implements PlaceProviderPort {

    private final GooglePlacesClient client;
    private final GooglePlacesProperties properties;

    public GooglePlacesAdapter(GooglePlacesClient client, GooglePlacesProperties properties) {
        this.client = client;
        this.properties = properties;
    }

    @Override
    public PlaceSearchResult searchText(PlaceSearchQueries.TextSearchQuery query) {
        Double lat = null;
        Double lng = null;
        if (query.cityCode() != null) {
            CityCode city = CityCode.valueOf(query.cityCode());
            double[] coords = cityCoordinates(city);
            lat = coords[0];
            lng = coords[1];
        }
        return client.searchText(
                new TextSearchRequest(
                        query.q(),
                        query.countryCode(),
                        lat,
                        lng,
                        query.maxResults()
                ),
                properties.getFieldMasks().getSearch()
        );
    }

    @Override
    public PlaceSearchResult searchNearby(PlaceSearchQueries.NearbySearchQuery query) {
        return client.searchNearby(
                new NearbySearchRequest(query.lat(), query.lng(), query.radiusMeters(), query.maxResults()),
                properties.getFieldMasks().getSearch()
        );
    }

    @Override
    public PlaceDetails fetchDetails(String providerPlaceId) {
        return client.getPlaceDetails(providerPlaceId, properties.getFieldMasks().getDetails());
    }

    @Override
    public byte[] fetchPhoto(String photoResourceName, int maxWidthPx) {
        return client.fetchPlacePhoto(photoResourceName, maxWidthPx);
    }

    private static double[] cityCoordinates(CityCode city) {
        return switch (city) {
            case CASABLANCA -> new double[]{33.5731, -7.5898};
            case RABAT -> new double[]{34.0209, -6.8416};
            case MARRAKECH -> new double[]{31.6295, -7.9811};
            case TANGIER -> new double[]{35.7595, -5.8340};
            case FES -> new double[]{34.0181, -5.0078};
            case AGADIR -> new double[]{30.4278, -9.5981};
            case OTHER -> new double[]{33.5731, -7.5898};
        };
    }
}
