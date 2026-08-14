package ma.nafura.platform.administration.iam.api.response.publicapi;

public record InvitationPreviewResponse(
    String tenantId,
    String tenantKey,
    String tenantName,
    String email,
    boolean requiresAccountSetup,
    boolean alreadyAccepted,
    String expiresAt
) {}
