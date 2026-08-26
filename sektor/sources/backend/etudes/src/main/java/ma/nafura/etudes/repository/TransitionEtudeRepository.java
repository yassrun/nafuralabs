package ma.nafura.etudes.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.audit.TransitionEtude;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransitionEtudeRepository extends JpaRepository<TransitionEtude, UUID> {

    List<TransitionEtude> findByTenantIdAndCorrelationIdOrderByDateTransitionAsc(
            UUID tenantId, UUID correlationId);

    List<TransitionEtude> findByTenantIdAndEntiteTypeAndEntiteIdOrderByDateTransitionAsc(
            UUID tenantId, String entiteType, String entiteId);
}
