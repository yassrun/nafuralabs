package ma.nafura.platform.usersettings.api.response;

public record UserNotificationSettingsResponse(
    boolean emailNotifications,
    boolean inAppNotifications,
    String digestFrequency
) {}


