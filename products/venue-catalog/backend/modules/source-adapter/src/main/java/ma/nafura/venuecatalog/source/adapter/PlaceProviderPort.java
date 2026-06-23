package ma.nafura.venuecatalog.source.adapter;

import ma.nafura.platform.integrations.googleplaces.PlaceDetails;
import ma.nafura.platform.integrations.googleplaces.PlaceSearchResult;

public interface PlaceProviderPort {

    PlaceSearchResult searchText(PlaceSearchQueries.TextSearchQuery query);

    PlaceSearchResult searchNearby(PlaceSearchQueries.NearbySearchQuery query);

    PlaceDetails fetchDetails(String providerPlaceId);

    byte[] fetchPhoto(String photoResourceName, int maxWidthPx);
}
