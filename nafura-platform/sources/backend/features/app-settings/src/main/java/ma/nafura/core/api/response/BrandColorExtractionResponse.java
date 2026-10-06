package ma.nafura.platform.appsettings.api.response;

import java.util.List;

public record BrandColorExtractionResponse(
    List<String> candidates,
    Suggested suggested
) {
    public record Suggested(String primary, String secondary, String accent) {}
}
