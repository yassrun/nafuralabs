package ma.nafura.platform.administration.iam.api.response.publicapi;

public record InvitationAcceptResponse(
    boolean alreadyAccepted,
    boolean loginRequired,
    String tenantId,
    String tenantKey,
    String tenantName,
    String email,
    String message
) {}
