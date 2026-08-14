package ma.nafura.hse.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.hse.domain.model.VisiteMedicale;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VisiteMedicaleRepository extends TenantScopedRepository<VisiteMedicale, String> {

    List<VisiteMedicale> findByTenantIdOrderByDateDescCreatedAtDesc(UUID tenantId);

    List<VisiteMedicale> findByTenantIdAndEmployeIdOrderByDateDescCreatedAtDesc(UUID tenantId, String employeId);

    List<VisiteMedicale> findByTenantIdAndProchaineEcheanceBetweenOrderByProchaineEcheanceAsc(
            UUID tenantId, LocalDate from, LocalDate to);

    long countByTenantId(UUID tenantId);
}
