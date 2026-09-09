package ma.nafura.chantiers.repository;
import java.util.*;
import ma.nafura.chantiers.domain.activite.PlanningReport;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PlanningReportRepository extends JpaRepository<PlanningReport,String> {
    List<PlanningReport> findByTenantIdAndChantierIdOrderByProposedAtDesc(UUID tenantId,String chantierId);
    Optional<PlanningReport> findByIdAndTenantIdAndChantierId(String id,UUID tenantId,String chantierId);
}
