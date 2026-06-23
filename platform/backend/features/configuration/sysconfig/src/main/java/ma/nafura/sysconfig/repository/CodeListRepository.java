package ma.nafura.platform.configuration.sysconfig.repository;

import ma.nafura.platform.configuration.sysconfig.domain.model.CodeList;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for CodeList entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface CodeListRepository extends TenantScopedRepository<CodeList, UUID> {
}


