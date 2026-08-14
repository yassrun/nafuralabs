package ma.nafura.platform.configuration.sysconfig.repository;

import ma.nafura.platform.configuration.sysconfig.domain.model.ReferenceValue;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for ReferenceValue entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface ReferenceValueRepository extends TenantScopedRepository<ReferenceValue, UUID> {
}


