package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.attachement.AttachementLigne;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttachementLigneRepository extends TenantScopedRepository<AttachementLigne, String> {

    List<AttachementLigne> findByTenantIdAndAttachementIdOrderByOrdreAsc(UUID tenantId, String attachementId);

    void deleteByTenantIdAndAttachementId(UUID tenantId, String attachementId);

    /** Contrat {@code situation-et-retenues}, AC-3 — les lignes des attachements consommés. */
    List<AttachementLigne> findByTenantIdAndAttachementIdInOrderByOrdreAsc(UUID tenantId, List<String> attachementIds);
}
