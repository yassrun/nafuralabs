package ma.nafura.chantiers.repository;
import java.util.*;
import ma.nafura.chantiers.domain.activite.PlanningPublication;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PlanningPublicationRepository extends JpaRepository<PlanningPublication,String> {
    List<PlanningPublication> findByTenantIdAndChantierIdOrderByNumeroDesc(UUID tenantId,String chantierId);
    Optional<PlanningPublication> findByIdAndTenantIdAndChantierId(String id,UUID tenantId,String chantierId);
}
