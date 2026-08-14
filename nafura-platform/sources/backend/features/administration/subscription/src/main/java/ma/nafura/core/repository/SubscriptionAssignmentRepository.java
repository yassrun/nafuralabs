package ma.nafura.platform.subscription.repository;

import ma.nafura.platform.subscription.domain.model.SubscriptionAssignment;
import ma.nafura.platform.subscription.domain.model.SubscriptionAssignmentOwnerType;
import ma.nafura.platform.subscription.domain.model.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionAssignmentRepository extends JpaRepository<SubscriptionAssignment, UUID> {

    Optional<SubscriptionAssignment> findFirstByApplicationIdAndOwnerTypeAndOwnerIdAndStatusOrderByUpdatedAtDesc(
        String applicationId,
        SubscriptionAssignmentOwnerType ownerType,
        UUID ownerId,
        SubscriptionStatus status
    );

    List<SubscriptionAssignment> findByApplicationIdAndOwnerTypeAndOwnerId(
        String applicationId,
        SubscriptionAssignmentOwnerType ownerType,
        UUID ownerId
    );
}

