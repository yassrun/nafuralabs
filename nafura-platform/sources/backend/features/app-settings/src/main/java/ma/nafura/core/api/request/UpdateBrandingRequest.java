package ma.nafura.platform.appsettings.api.request;

public record UpdateBrandingRequest(
    String logoUrl,
    String faviconUrl,
    String primaryColor,
    String tenantDisplayName
) {}

