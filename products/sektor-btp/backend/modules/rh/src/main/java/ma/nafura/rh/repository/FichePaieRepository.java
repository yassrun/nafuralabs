package ma.nafura.rh.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.model.FichePaie;
import org.springframework.stereotype.Repository;

@Repository
public interface FichePaieRepository extends TenantScopedRepository<FichePaie, String> {

    List<FichePaie> findByTenantIdOrderByMoisDescNumeroDesc(UUID tenantId);

    List<FichePaie> findByTenantIdAndEmployeIdOrderByMoisDescNumeroDesc(UUID tenantId, String employeId);

    List<FichePaie> findByTenantIdAndMoisOrderByNumeroAsc(UUID tenantId, String mois);

    List<FichePaie> findByTenantIdAndEmployeIdAndMoisOrderByNumeroAsc(
            UUID tenantId, String employeId, String mois);

    Optional<FichePaie> findByTenantIdAndEmployeIdAndMois(UUID tenantId, String employeId, String mois);

    long countByTenantId(UUID tenantId);
}
