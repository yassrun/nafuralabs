package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.SituationLigne;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SituationLigneRepository extends TenantScopedRepository<SituationLigne, String> {

    List<SituationLigne> findByTenantIdAndSituationIdOrderByOrdreAsc(UUID tenantId, String situationId);

    void deleteByTenantIdAndSituationId(UUID tenantId, String situationId);
}
