package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.TradeEffect;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TradeEffectRepository extends JpaRepository<TradeEffect, UUID> {

    long countByTenantId(UUID tenantId);

    List<TradeEffect> findByTenantIdOrderByDueDateDesc(UUID tenantId);

    List<TradeEffect> findByTenantIdAndStatusOrderByDueDateDesc(UUID tenantId, String status);

    Optional<TradeEffect> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<TradeEffect> findTopByTenantIdOrderByEffectNumberDesc(UUID tenantId);
}
