package ma.nafura.platform.subscription.api.response;

public record SubscriptionPlanResponse(
    String id,
    String name,
    String description,
    Double pricePerMonth,
    String currency,
    boolean isCurrent
) {}

