package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.calendrier.CalendrierExceptionCreneau;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CalendrierExceptionCreneauRepository
        extends TenantScopedRepository<CalendrierExceptionCreneau, String> {

    List<CalendrierExceptionCreneau> findByTenantIdAndExceptionId(UUID tenantId, String exceptionId);

    void deleteByExceptionId(String exceptionId);
}
