package ma.nafura.hse.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.hse.domain.model.DuerRisque;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DuerRisqueRepository extends TenantScopedRepository<DuerRisque, String> {

    List<DuerRisque> findByTenantIdAndDuerIdOrderByOrdreAsc(UUID tenantId, String duerId);

    void deleteByTenantIdAndDuerId(UUID tenantId, String duerId);

    long countByTenantIdAndDuerId(UUID tenantId, String duerId);
}
