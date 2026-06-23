package ma.nafura.platform.subscription.repository;

import ma.nafura.platform.subscription.domain.model.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {

    Optional<SubscriptionPlan> findByApplicationIdAndPlanCodeAndActiveTrue(String applicationId, String planCode);

    List<SubscriptionPlan> findByApplicationIdAndActiveTrueOrderByPlanCode(String applicationId);
}

