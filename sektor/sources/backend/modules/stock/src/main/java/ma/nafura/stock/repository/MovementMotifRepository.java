package ma.nafura.stock.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.stock.domain.model.MovementMotif;
import org.springframework.stereotype.Repository;

@Repository
public interface MovementMotifRepository extends TenantScopedRepository<MovementMotif, UUID> {

    List<MovementMotif> findByTenantIdAndTxTypeAndIsActiveTrueOrderByCodeAsc(UUID tenantId, String txType);

    List<MovementMotif> findByTenantIdOrderByTxTypeAscCodeAsc(UUID tenantId);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);
}
