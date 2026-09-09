package ma.nafura.chantiers.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.calendrier.CalendrierVersion;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CalendrierVersionRepository extends TenantScopedRepository<CalendrierVersion, String> {

    List<CalendrierVersion> findByTenantIdAndCalendrierIdOrderByDateEffetAsc(UUID tenantId, String calendrierId);

    Optional<CalendrierVersion> findByCalendrierIdAndDateEffet(String calendrierId, LocalDate dateEffet);
}
