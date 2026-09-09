package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.calendrier.CalendrierCreneau;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CalendrierCreneauRepository extends TenantScopedRepository<CalendrierCreneau, String> {

    List<CalendrierCreneau> findByTenantIdAndVersionId(UUID tenantId, String versionId);

    void deleteByVersionId(String versionId);
}
