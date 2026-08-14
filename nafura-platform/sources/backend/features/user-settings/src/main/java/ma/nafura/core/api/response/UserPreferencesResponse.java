package ma.nafura.platform.usersettings.api.response;

public record UserPreferencesResponse(
    String locale,
    String timezone,
    String theme,
    String dateFormat
) {}


