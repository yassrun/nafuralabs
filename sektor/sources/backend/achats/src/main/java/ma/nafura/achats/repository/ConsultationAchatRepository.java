package ma.nafura.achats.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.consultation.ConsultationAchat;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationAchatRepository extends TenantScopedRepository<ConsultationAchat, UUID> {

    List<ConsultationAchat> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<ConsultationAchat> findByTenantIdAndDossierEtudeIdIsNullOrderByCreatedAtDesc(UUID tenantId);

    List<ConsultationAchat> findByTenantIdAndDossierEtudeIdIsNotNullOrderByCreatedAtDesc(UUID tenantId);

    List<ConsultationAchat> findByTenantIdAndDossierEtudeId(UUID tenantId, UUID dossierEtudeId);

    Optional<ConsultationAchat> findByTenantIdAndNumero(UUID tenantId, String numero);

    long countByTenantId(UUID tenantId);
}
