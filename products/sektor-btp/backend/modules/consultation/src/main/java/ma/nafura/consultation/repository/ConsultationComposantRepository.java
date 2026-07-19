package ma.nafura.consultation.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.consultation.domain.model.ConsultationComposant;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationComposantRepository extends TenantScopedRepository<ConsultationComposant, UUID> {

    List<ConsultationComposant> findByTenantIdAndNoeudIdOrderByOrdreAsc(UUID tenantId, UUID noeudId);

    List<ConsultationComposant> findByTenantIdAndNoeudIdIn(UUID tenantId, List<UUID> noeudIds);

    void deleteByNoeudId(UUID noeudId);
}
