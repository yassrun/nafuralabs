package ma.nafura.chantiers.repository;
import java.time.LocalDate;
import java.util.*;
import ma.nafura.chantiers.domain.activite.PlanningWeek;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PlanningWeekRepository extends JpaRepository<PlanningWeek,String> {
    Optional<PlanningWeek> findByTenantIdAndChantierIdAndWeekStart(UUID tenantId,String chantierId,LocalDate start);
}
