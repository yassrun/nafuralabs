package ma.nafura.usageops.alerts.repository;

import ma.nafura.usageops.alerts.domain.UsageAlertEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsageAlertEventRepository extends JpaRepository<UsageAlertEvent, UUID> {
    List<UsageAlertEvent> findAllByOrderByCreatedAtDesc();

    Optional<UsageAlertEvent> findByAlertKeyAndWindowKey(String alertKey, String windowKey);
}
