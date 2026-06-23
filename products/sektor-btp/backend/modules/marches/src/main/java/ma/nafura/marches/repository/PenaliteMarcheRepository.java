package ma.nafura.marches.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.marches.domain.model.PenaliteMarche;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PenaliteMarcheRepository extends TenantScopedRepository<PenaliteMarche, String> {

    List<PenaliteMarche> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<PenaliteMarche> findByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(UUID tenantId, String contratMarcheId);

    long countByTenantId(UUID tenantId);
}
