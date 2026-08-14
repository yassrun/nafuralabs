package ma.nafura.marches.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.marches.domain.model.BpuLigne;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BpuLigneRepository extends TenantScopedRepository<BpuLigne, String> {

    List<BpuLigne> findByTenantIdAndContratMarcheIdOrderByOrdreAsc(UUID tenantId, String contratMarcheId);

    long countByTenantIdAndContratMarcheId(UUID tenantId, String contratMarcheId);
}
