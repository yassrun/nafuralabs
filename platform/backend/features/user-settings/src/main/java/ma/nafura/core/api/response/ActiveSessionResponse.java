package ma.nafura.platform.usersettings.api.response;

public record ActiveSessionResponse(
    String id,
    String deviceName,
    String ipAddress,
    String location,
    String lastActiveAt,
    boolean isCurrent
) {}


