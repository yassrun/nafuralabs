package ma.nafura.marches.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.marches.domain.model.FactureMarche;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FactureMarcheRepository extends TenantScopedRepository<FactureMarche, String> {

    List<FactureMarche> findByTenantIdOrderByDateEmissionDescCreatedAtDesc(UUID tenantId);

    List<FactureMarche> findByTenantIdAndContratMarcheIdOrderByDateEmissionDescCreatedAtDesc(
            UUID tenantId, String contratMarcheId);

    long countByTenantId(UUID tenantId);
}
