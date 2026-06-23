package ma.nafura.rh.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.model.Pointage;
import org.springframework.stereotype.Repository;

@Repository
public interface PointageRepository extends TenantScopedRepository<Pointage, String> {

    List<Pointage> findByTenantIdAndChantierIdAndDateOrderByEmployeIdAsc(
            UUID tenantId, String chantierId, LocalDate date);

    List<Pointage> findByTenantIdAndDateOrderByEmployeIdAsc(UUID tenantId, LocalDate date);

    List<Pointage> findByTenantIdAndChantierIdAndDateBetweenOrderByDateAscEmployeIdAsc(
            UUID tenantId, String chantierId, LocalDate from, LocalDate to);

    List<Pointage> findByTenantIdAndDateBetweenOrderByDateAscEmployeIdAsc(
            UUID tenantId, LocalDate from, LocalDate to);

    List<Pointage> findByTenantIdAndEmployeIdAndDateBetweenOrderByDateAsc(
            UUID tenantId, String employeId, LocalDate from, LocalDate to);

    List<Pointage> findByTenantIdAndBatchIdOrderByEmployeIdAsc(UUID tenantId, String batchId);

    long countByTenantId(UUID tenantId);
}
