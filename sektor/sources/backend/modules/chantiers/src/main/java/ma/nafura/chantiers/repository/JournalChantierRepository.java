package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.JournalChantier;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JournalChantierRepository extends TenantScopedRepository<JournalChantier, String> {

    List<JournalChantier> findByTenantIdAndChantierIdOrderByDateDescCreatedAtDesc(
            UUID tenantId, String chantierId);
}
