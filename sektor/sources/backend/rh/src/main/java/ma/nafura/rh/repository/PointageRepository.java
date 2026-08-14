package ma.nafura.rh.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.temps.Pointage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface PointageRepository extends TenantScopedRepository<Pointage, UUID> {

    List<Pointage> findByTenantIdAndChantierIdAndDateOrderByEmployeIdAsc(
            UUID tenantId, String chantierId, LocalDate date);

    List<Pointage> findByTenantIdAndDateOrderByEmployeIdAsc(UUID tenantId, LocalDate date);

    List<Pointage> findByTenantIdAndChantierIdAndDateBetweenOrderByDateAscEmployeIdAsc(
            UUID tenantId, String chantierId, LocalDate from, LocalDate to);

    List<Pointage> findByTenantIdAndDateBetweenOrderByDateAscEmployeIdAsc(
            UUID tenantId, LocalDate from, LocalDate to);

    List<Pointage> findByTenantIdAndEmployeIdAndDateBetweenOrderByDateAsc(
            UUID tenantId, String employeId, LocalDate from, LocalDate to);

    List<Pointage> findByTenantIdAndBatchIdOrderByEmployeIdAsc(UUID tenantId, UUID batchId);

    Optional<Pointage> findByTenantIdAndEmployeIdAndDateAndChantierId(
            UUID tenantId, String employeId, LocalDate date, String chantierId);

    boolean existsByTenantIdAndEmployeIdAndDateAndChantierId(
            UUID tenantId, String employeId, LocalDate date, String chantierId);

    Page<Pointage> findByTenantIdOrderByDateDescEmployeIdAsc(UUID tenantId, Pageable pageable);

    Page<Pointage> findByTenantIdAndChantierIdOrderByDateDescEmployeIdAsc(
            UUID tenantId, String chantierId, Pageable pageable);

    long countByTenantId(UUID tenantId);
}
