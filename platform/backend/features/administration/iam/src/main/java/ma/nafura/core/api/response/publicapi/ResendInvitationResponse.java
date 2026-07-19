package ma.nafura.platform.administration.iam.api.response.publicapi;

public record ResendInvitationResponse(
    String email,
    String emailDeliveryStatus,
    String message
) {}
