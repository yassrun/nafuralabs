package ma.nafura.stock.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.stock.domain.model.InventoryTxSequence;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryTxSequenceRepository extends TenantScopedRepository<InventoryTxSequence, UUID> {

    Optional<InventoryTxSequence> findByTenantIdAndTxTypeAndExercice(
            UUID tenantId, String txType, Integer exercice);
}
