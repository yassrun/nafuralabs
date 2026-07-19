package ma.nafura.consultation.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.consultation.domain.model.Consultation;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationRepository extends TenantScopedRepository<Consultation, UUID> {

    boolean existsByTenantIdAndNumero(UUID tenantId, String numero);

    List<Consultation> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
