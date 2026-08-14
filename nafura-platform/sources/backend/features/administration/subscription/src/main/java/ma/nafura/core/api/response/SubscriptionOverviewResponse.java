package ma.nafura.platform.subscription.api.response;

import java.util.List;

public record SubscriptionOverviewResponse(
    SubscriptionPlanResponse currentPlan,
    List<SubscriptionPlanResponse> availablePlans,
    List<SubscriptionUsageMetricResponse> metrics
) {}

