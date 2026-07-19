package ma.nafura.consultation.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.consultation.domain.model.ConsultationNoeud;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationNoeudRepository extends TenantScopedRepository<ConsultationNoeud, UUID> {

    List<ConsultationNoeud> findByTenantIdAndConsultationIdOrderByOrdreAsc(UUID tenantId, UUID consultationId);

    void deleteByConsultationId(UUID consultationId);
}
