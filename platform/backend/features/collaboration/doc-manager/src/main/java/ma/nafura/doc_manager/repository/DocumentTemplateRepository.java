package ma.nafura.platform.collaboration.docmanager.repository;

import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DocumentTemplateRepository extends TenantScopedRepository<DocumentTemplate, UUID> {

    Page<DocumentTemplate> findByTenantIdAndEntityType(UUID tenantId, String entityType, Pageable pageable);
}


