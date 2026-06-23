package ma.nafura.hse.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.hse.domain.model.EpiDotation;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EpiDotationRepository extends TenantScopedRepository<EpiDotation, String> {

    List<EpiDotation> findByTenantIdOrderByDateAttributionDescCreatedAtDesc(UUID tenantId);

    List<EpiDotation> findByTenantIdAndEmployeIdOrderByDateAttributionDesc(UUID tenantId, String employeId);

    List<EpiDotation> findByTenantIdAndDateExpirationBetweenOrderByDateExpirationAsc(
            UUID tenantId, LocalDate from, LocalDate to);

    List<EpiDotation> findByTenantIdAndEmployeIdAndDateExpirationBetweenOrderByDateExpirationAsc(
            UUID tenantId, String employeId, LocalDate from, LocalDate to);

    long countByTenantId(UUID tenantId);
}
