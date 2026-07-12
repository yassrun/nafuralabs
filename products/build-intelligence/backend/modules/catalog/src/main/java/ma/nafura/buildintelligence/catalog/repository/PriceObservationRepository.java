package ma.nafura.buildintelligence.catalog.repository;

import ma.nafura.buildintelligence.catalog.domain.PriceObservation;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PriceObservationRepository extends TenantScopedRepository<PriceObservation, UUID> {

    List<PriceObservation> findByWorkItemIdAndTenantIdOrderByObservedAtDesc(UUID workItemId, UUID tenantId);
}
