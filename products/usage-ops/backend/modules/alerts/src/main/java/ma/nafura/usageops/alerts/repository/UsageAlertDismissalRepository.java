package ma.nafura.usageops.alerts.repository;

import ma.nafura.usageops.alerts.domain.UsageAlertDismissal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsageAlertDismissalRepository extends JpaRepository<UsageAlertDismissal, UUID> {
    List<UsageAlertDismissal> findByUserId(String userId);

    Optional<UsageAlertDismissal> findByAlertKeyAndUserId(String alertKey, String userId);

    boolean existsByAlertKeyAndUserId(String alertKey, String userId);
}
