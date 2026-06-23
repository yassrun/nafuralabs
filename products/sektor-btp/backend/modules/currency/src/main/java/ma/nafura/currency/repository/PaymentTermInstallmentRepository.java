package ma.nafura.currency.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import ma.nafura.currency.domain.model.PaymentTermInstallment;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTermInstallmentRepository extends TenantScopedRepository<PaymentTermInstallment, UUID> {

    List<PaymentTermInstallment> findByTenantIdAndPaymentTermIdOrderByLineOrderAsc(
            UUID tenantId, UUID paymentTermId);

    List<PaymentTermInstallment> findByTenantIdAndPaymentTermIdInOrderByPaymentTermIdAscLineOrderAsc(
            UUID tenantId, Collection<UUID> paymentTermIds);

    void deleteByTenantIdAndPaymentTermId(UUID tenantId, UUID paymentTermId);
}
