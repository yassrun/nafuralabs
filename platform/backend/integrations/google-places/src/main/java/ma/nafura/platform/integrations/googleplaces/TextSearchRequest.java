package ma.nafura.platform.integrations.googleplaces;

public record TextSearchRequest(
        String textQuery,
        String regionCode,
        Double latitude,
        Double longitude,
        Integer maxResultCount
) {}
