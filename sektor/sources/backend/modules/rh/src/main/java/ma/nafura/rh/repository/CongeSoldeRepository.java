package ma.nafura.rh.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.model.CongeSolde;
import org.springframework.stereotype.Repository;

@Repository
public interface CongeSoldeRepository extends TenantScopedRepository<CongeSolde, String> {

    Optional<CongeSolde> findByTenantIdAndEmployeId(UUID tenantId, String employeId);

    List<CongeSolde> findByTenantIdOrderByEmployeIdAsc(UUID tenantId);

    long countByTenantId(UUID tenantId);
}
