package ma.nafura.platform.authorization.api.response.auth;

public record CurrentUserResponse(
    String id,
    String email,
    String firstName,
    String lastName,
    String displayName,
    String avatarUrl,
    boolean isSuperAdmin,
    String createdAt,
    String updatedAt,
    String lastLoginAt
) {}

