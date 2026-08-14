package ma.nafura.marches.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.domain.model.DgdMarche;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DgdMarcheRepository extends TenantScopedRepository<DgdMarche, String> {

    List<DgdMarche> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<DgdMarche> findByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(UUID tenantId, String contratMarcheId);

    Optional<DgdMarche> findFirstByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(
            UUID tenantId, String contratMarcheId);

    long countByTenantId(UUID tenantId);
}
