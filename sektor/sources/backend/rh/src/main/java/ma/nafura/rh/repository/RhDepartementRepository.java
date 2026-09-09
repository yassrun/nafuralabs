package ma.nafura.rh.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.referentiel.RhDepartement;
import org.springframework.stereotype.Repository;

@Repository
public interface RhDepartementRepository extends TenantScopedRepository<RhDepartement, String> {

    List<RhDepartement> findByTenantIdOrderByLibelleAsc(UUID tenantId);

    List<RhDepartement> findByTenantIdAndActifOrderByLibelleAsc(UUID tenantId, boolean actif);

    Optional<RhDepartement> findByTenantIdAndCodeIgnoreCase(UUID tenantId, String code);

    Optional<RhDepartement> findByTenantIdAndLibelleIgnoreCase(UUID tenantId, String libelle);

    long countByTenantId(UUID tenantId);
}
