package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.calendrier.CalendrierException;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CalendrierExceptionRepository extends TenantScopedRepository<CalendrierException, String> {

    List<CalendrierException> findByTenantIdAndVersionId(UUID tenantId, String versionId);

    void deleteByVersionId(String versionId);
}
