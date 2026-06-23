package ma.nafura.platform.collaboration.notification.repository;

import ma.nafura.platform.collaboration.notification.domain.model.Escalation;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EscalationRepository extends TenantScopedRepository<Escalation, UUID> {
}


