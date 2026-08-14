package ma.nafura.marches.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.domain.model.RevisionPrix;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RevisionPrixRepository extends TenantScopedRepository<RevisionPrix, String> {

    List<RevisionPrix> findByTenantIdAndContratMarcheIdOrderByPeriodeDesc(
            UUID tenantId, String contratMarcheId);

    List<RevisionPrix> findByTenantIdOrderByPeriodeDescCreatedAtDesc(UUID tenantId);

    Optional<RevisionPrix> findByTenantIdAndContratMarcheIdAndPeriode(
            UUID tenantId, String contratMarcheId, String periode);

    long countByTenantId(UUID tenantId);
}
