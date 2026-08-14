package ma.nafura.platform.usersettings.api.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateNotificationSettingsRequest(
    boolean emailNotifications,
    boolean inAppNotifications,
    @NotBlank String digestFrequency
) {}

