package ma.nafura.platform.collaboration.notification.repository;

import ma.nafura.platform.collaboration.notification.domain.model.AlertRule;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/** @deprecated See {@link AlertRule}. */
@Deprecated
@Repository
public interface AlertRuleRepository extends TenantScopedRepository<AlertRule, UUID> {
}


