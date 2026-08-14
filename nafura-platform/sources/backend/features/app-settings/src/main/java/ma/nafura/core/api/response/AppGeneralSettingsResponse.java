package ma.nafura.platform.appsettings.api.response;

public record AppGeneralSettingsResponse(
    String tenantName,
    String contactEmail,
    String supportEmail,
    String timezone
) {}


