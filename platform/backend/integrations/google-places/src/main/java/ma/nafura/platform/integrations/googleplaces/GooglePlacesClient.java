package ma.nafura.platform.integrations.googleplaces;

public interface GooglePlacesClient {

    PlaceSearchResult searchText(TextSearchRequest request, String fieldMask);

    PlaceSearchResult searchNearby(NearbySearchRequest request, String fieldMask);

    PlaceDetails getPlaceDetails(String placeId, String fieldMask);

    byte[] fetchPlacePhoto(String photoResourceName, int maxWidthPx);
}
