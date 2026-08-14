package ma.nafura.finance.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.Currency;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for Currency entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface CurrencyRepository extends TenantScopedRepository<Currency, UUID> {

    Optional<Currency> findByTenantIdAndCode(UUID tenantId, String code);

    Optional<Currency> findFirstByTenantIdAndIsReferenceTrue(UUID tenantId);
}
