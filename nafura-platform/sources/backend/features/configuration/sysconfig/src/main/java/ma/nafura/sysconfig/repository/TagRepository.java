package ma.nafura.platform.configuration.sysconfig.repository;

import ma.nafura.platform.configuration.sysconfig.domain.model.Tag;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for Tag entity.
 * Generated once — add custom queries here.
 */
@Repository("sysconfigTagRepository")
public interface TagRepository extends TenantScopedRepository<Tag, UUID> {
}


