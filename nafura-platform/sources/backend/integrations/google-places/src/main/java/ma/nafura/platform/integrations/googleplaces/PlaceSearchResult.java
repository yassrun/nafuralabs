package ma.nafura.platform.integrations.googleplaces;

import java.util.List;

public record PlaceSearchResult(
        List<PlaceSearchHit> places,
        String nextPageToken
) {}
