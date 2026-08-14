package ma.nafura.rh.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.model.Habilitation;
import org.springframework.stereotype.Repository;

@Repository
public interface HabilitationRepository extends TenantScopedRepository<Habilitation, String> {

    List<Habilitation> findByTenantIdOrderByDateExpirationAscDateObtentionDesc(UUID tenantId);

    List<Habilitation> findByTenantIdAndEmployeIdOrderByDateExpirationAsc(UUID tenantId, String employeId);

    List<Habilitation> findByTenantIdAndDateExpirationBetweenOrderByDateExpirationAsc(
            UUID tenantId, LocalDate from, LocalDate to);

    List<Habilitation> findByTenantIdAndEmployeIdAndDateExpirationBetweenOrderByDateExpirationAsc(
            UUID tenantId, String employeId, LocalDate from, LocalDate to);

    long countByTenantId(UUID tenantId);
}
