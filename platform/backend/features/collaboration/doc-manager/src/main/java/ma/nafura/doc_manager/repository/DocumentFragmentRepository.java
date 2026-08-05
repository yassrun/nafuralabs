package ma.nafura.platform.collaboration.docmanager.repository;

import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentFragment;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentFragmentRepository extends TenantScopedRepository<DocumentFragment, UUID> {

    List<DocumentFragment> findAllByTenantId(UUID tenantId);

    Optional<DocumentFragment> findByTenantIdAndCode(UUID tenantId, String code);
}
