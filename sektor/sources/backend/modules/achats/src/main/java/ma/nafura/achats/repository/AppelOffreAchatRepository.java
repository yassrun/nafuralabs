package ma.nafura.achats.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.model.AppelOffreAchat;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppelOffreAchatRepository extends TenantScopedRepository<AppelOffreAchat, UUID> {

    Optional<AppelOffreAchat> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<AppelOffreAchat> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<AppelOffreAchat> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<AppelOffreAchat> findByTenantIdAndChantierIdOrderByCreatedAtDesc(UUID tenantId, String chantierId);

    List<AppelOffreAchat> findByTenantIdAndStatusAndChantierIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String chantierId);

    long countByTenantId(UUID tenantId);
}
