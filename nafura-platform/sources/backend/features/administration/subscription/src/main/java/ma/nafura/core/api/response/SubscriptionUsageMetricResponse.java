package ma.nafura.platform.subscription.api.response;

public record SubscriptionUsageMetricResponse(
    String key,
    String label,
    long used,
    Long limit
) {}

