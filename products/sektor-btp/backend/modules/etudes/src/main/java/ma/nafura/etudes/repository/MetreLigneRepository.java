package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.MetreLigne;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MetreLigneRepository extends TenantScopedRepository<MetreLigne, UUID> {

    List<MetreLigne> findByMetre_IdAndTenantIdOrderByCreatedAtAsc(UUID metreId, UUID tenantId);

    Optional<MetreLigne> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("SELECT l FROM MetreLigne l JOIN FETCH l.metre WHERE l.id = :id AND l.tenantId = :tenantId")
    Optional<MetreLigne> findByIdAndTenantIdWithMetre(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
}
