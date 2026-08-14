package ma.nafura.marches.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.marches.domain.model.OrdreServiceMarche;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrdreServiceMarcheRepository extends TenantScopedRepository<OrdreServiceMarche, String> {

    List<OrdreServiceMarche> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<OrdreServiceMarche> findByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(UUID tenantId, String contratMarcheId);

    long countByTenantId(UUID tenantId);
}
