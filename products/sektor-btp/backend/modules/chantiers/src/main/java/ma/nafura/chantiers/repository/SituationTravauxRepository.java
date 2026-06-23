package ma.nafura.chantiers.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.SituationTravaux;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SituationTravauxRepository extends TenantScopedRepository<SituationTravaux, String> {

    List<SituationTravaux> findByTenantIdAndChantierIdOrderByNumeroOrdreDesc(UUID tenantId, String chantierId);

    Optional<SituationTravaux> findByTenantIdAndChantierIdAndNumeroOrdre(
            UUID tenantId, String chantierId, int numeroOrdre);

    long countByTenantIdAndChantierIdAndStatusNotIn(
            UUID tenantId, String chantierId, Collection<String> statuses);
}
