package ma.nafura.rh.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.referentiel.RhPoste;
import org.springframework.stereotype.Repository;

@Repository
public interface RhPosteRepository extends TenantScopedRepository<RhPoste, String> {

    List<RhPoste> findByTenantIdOrderByLibelleAsc(UUID tenantId);

    List<RhPoste> findByTenantIdAndActifOrderByLibelleAsc(UUID tenantId, boolean actif);

    Optional<RhPoste> findByTenantIdAndCodeIgnoreCase(UUID tenantId, String code);

    Optional<RhPoste> findByTenantIdAndLibelleIgnoreCase(UUID tenantId, String libelle);

    long countByTenantId(UUID tenantId);
}
