package ma.nafura.catalogue.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.catalogue.domain.stock.InventoryTxSequence;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryTxSequenceRepository extends TenantScopedRepository<InventoryTxSequence, UUID> {

    Optional<InventoryTxSequence> findByTenantIdAndTxTypeAndExercice(
            UUID tenantId, String txType, Integer exercice);
}
