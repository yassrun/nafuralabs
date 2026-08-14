package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.DocumentChantier;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentChantierRepository extends TenantScopedRepository<DocumentChantier, String> {

    List<DocumentChantier> findByTenantIdOrderByUploadedAtDescCreatedAtDesc(UUID tenantId);

    List<DocumentChantier> findByTenantIdAndChantierIdOrderByUploadedAtDescCreatedAtDesc(
            UUID tenantId, String chantierId);

    long countByTenantId(UUID tenantId);
}
