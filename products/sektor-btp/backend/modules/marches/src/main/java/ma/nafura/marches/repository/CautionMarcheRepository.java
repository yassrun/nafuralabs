package ma.nafura.marches.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.marches.domain.model.CautionMarche;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CautionMarcheRepository extends TenantScopedRepository<CautionMarche, String> {

    List<CautionMarche> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<CautionMarche> findByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(UUID tenantId, String contratMarcheId);

    List<CautionMarche> findByTenantIdAndStatusInAndDateExpirationBetweenOrderByDateExpirationAsc(
            UUID tenantId, List<String> statuses, LocalDate from, LocalDate to);

    long countByTenantId(UUID tenantId);
}
