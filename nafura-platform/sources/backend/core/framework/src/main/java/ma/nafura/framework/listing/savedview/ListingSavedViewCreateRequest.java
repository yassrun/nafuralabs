package ma.nafura.platform.framework.listing.savedview;

public record ListingSavedViewCreateRequest(
        String resourceKey, String name, boolean isDefault, String queryJson) {}
