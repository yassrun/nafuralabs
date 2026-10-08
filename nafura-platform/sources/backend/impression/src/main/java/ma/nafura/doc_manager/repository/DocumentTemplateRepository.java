package ma.nafura.platform.collaboration.docmanager.repository;

import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentTemplateRepository extends RecordRepository<DocumentTemplate> {

    Page<DocumentTemplate> findByTenantIdAndEntityType(UUID tenantId, String entityType, Pageable pageable);

    Page<DocumentTemplate> findByTenantId(UUID tenantId, Pageable pageable);

    Optional<DocumentTemplate> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<DocumentTemplate> findByTenantIdAndCode(UUID tenantId, String code);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);

    boolean existsByTenantIdAndCodeAndIdNot(UUID tenantId, String code, UUID id);
}


