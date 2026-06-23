package ma.nafura.platform.appsettings.api.response;

public record AppBrandingSettingsResponse(
    String logoUrl,
    String faviconUrl,
    String primaryColor,
    String tenantDisplayName
) {}


