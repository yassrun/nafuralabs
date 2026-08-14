package ma.nafura.platform.subscription.service;

import ma.nafura.platform.subscription.domain.model.SubscriptionAssignmentOwnerType;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionEntitlementService {

    boolean isEntitled(String applicationId, SubscriptionAssignmentOwnerType ownerType, UUID ownerId, String entitlementKey);

    Optional<String> resolveEntitlementValue(
        String applicationId,
        SubscriptionAssignmentOwnerType ownerType,
        UUID ownerId,
        String entitlementKey
    );
}

