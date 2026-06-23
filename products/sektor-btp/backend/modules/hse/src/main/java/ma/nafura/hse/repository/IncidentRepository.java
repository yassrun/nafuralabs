package ma.nafura.hse.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.hse.domain.model.Incident;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentRepository extends TenantScopedRepository<Incident, String> {

    Optional<Incident> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<Incident> findByTenantIdOrderByDateIncidentDescCreatedAtDesc(UUID tenantId);

    List<Incident> findByTenantIdAndStatusOrderByDateIncidentDescCreatedAtDesc(UUID tenantId, String status);

    List<Incident> findByTenantIdAndGraviteOrderByDateIncidentDescCreatedAtDesc(UUID tenantId, String gravite);

    List<Incident> findByTenantIdAndStatusAndGraviteOrderByDateIncidentDescCreatedAtDesc(
            UUID tenantId, String status, String gravite);

    long countByTenantId(UUID tenantId);

    List<Incident> findByTenantIdAndDateIncidentBetweenOrderByDateIncidentAsc(
            UUID tenantId, LocalDate from, LocalDate to);

    List<Incident> findByTenantIdAndChantierIdAndDateIncidentBetweenOrderByDateIncidentAsc(
            UUID tenantId, String chantierId, LocalDate from, LocalDate to);
}
