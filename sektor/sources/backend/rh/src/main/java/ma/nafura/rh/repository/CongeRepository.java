package ma.nafura.rh.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.model.Conge;
import org.springframework.stereotype.Repository;

@Repository
public interface CongeRepository extends TenantScopedRepository<Conge, String> {

    List<Conge> findByTenantIdAndStatusInAndDateDebutLessThanEqualAndDateFinGreaterThanEqualOrderByDateDebutAsc(
            UUID tenantId, Collection<String> statuses, LocalDate to, LocalDate from);

    List<Conge> findByTenantIdOrderByDateDebutDescNumeroDesc(UUID tenantId);

    List<Conge> findByTenantIdAndStatusOrderByDateDebutDescNumeroDesc(UUID tenantId, String status);

    List<Conge> findByTenantIdAndEmployeIdOrderByDateDebutDescNumeroDesc(UUID tenantId, String employeId);

    List<Conge> findByTenantIdAndEmployeIdAndStatusOrderByDateDebutDescNumeroDesc(
            UUID tenantId, String employeId, String status);

    List<Conge> findByTenantIdAndTypeOrderByDateDebutDescNumeroDesc(UUID tenantId, String type);

    List<Conge> findByTenantIdAndEmployeIdAndTypeOrderByDateDebutDescNumeroDesc(
            UUID tenantId, String employeId, String type);

    long countByTenantId(UUID tenantId);
}
