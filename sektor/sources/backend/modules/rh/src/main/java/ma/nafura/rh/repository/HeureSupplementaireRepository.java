package ma.nafura.rh.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.model.HeureSupplementaire;
import org.springframework.stereotype.Repository;

@Repository
public interface HeureSupplementaireRepository extends TenantScopedRepository<HeureSupplementaire, String> {

    List<HeureSupplementaire> findByTenantIdOrderByDateDescIdDesc(UUID tenantId);

    List<HeureSupplementaire> findByTenantIdAndEmployeIdOrderByDateDescIdDesc(UUID tenantId, String employeId);

    List<HeureSupplementaire> findByTenantIdAndEmployeIdAndDateBetweenOrderByDateDescIdDesc(
            UUID tenantId, String employeId, LocalDate from, LocalDate to);

    List<HeureSupplementaire> findByTenantIdAndDateBetweenOrderByDateDescIdDesc(
            UUID tenantId, LocalDate from, LocalDate to);

    long countByTenantId(UUID tenantId);
}
