package ma.nafura.platform.subscription.repository;

import ma.nafura.platform.subscription.domain.model.SubscriptionEntitlement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionEntitlementRepository extends JpaRepository<SubscriptionEntitlement, UUID> {

    Optional<SubscriptionEntitlement> findFirstByApplicationIdAndPlanCodeAndEntitlementKeyAndEnabledTrue(
        String applicationId,
        String planCode,
        String entitlementKey
    );
}

