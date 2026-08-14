package ma.nafura.platform.usersettings.api.response;

public record UserProfileResponse(
    String firstName,
    String lastName,
    String displayName,
    String avatarUrl,
    String phone
) {}


