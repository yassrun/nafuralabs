package ma.nafura.hse.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.hse.domain.model.FormationHse;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FormationHseRepository extends TenantScopedRepository<FormationHse, String> {

    List<FormationHse> findByTenantIdOrderByDateDebutDescCreatedAtDesc(UUID tenantId);

    List<FormationHse> findByTenantIdAndStatusOrderByDateDebutDescCreatedAtDesc(UUID tenantId, String status);

    List<FormationHse> findByTenantIdAndAttestationValiditeBetweenOrderByAttestationValiditeAsc(
            UUID tenantId, LocalDate from, LocalDate to);

    long countByTenantId(UUID tenantId);
}
