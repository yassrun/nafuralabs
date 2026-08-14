package ma.nafura.finance.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.PaymentMode;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentModeRepository extends TenantScopedRepository<PaymentMode, UUID> {

    Optional<PaymentMode> findByTenantIdAndCode(UUID tenantId, String code);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);
}
