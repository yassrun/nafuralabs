package ma.nafura.platform.collaboration.audit.repository;

import ma.nafura.platform.collaboration.audit.domain.model.IntegrationError;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface IntegrationErrorRepository extends TenantScopedRepository<IntegrationError, UUID> {
}


