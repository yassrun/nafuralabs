package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DpgfNoeudRepository extends TenantScopedRepository<DpgfNoeud, UUID> {

    List<DpgfNoeud> findByDpgfIdAndTenantIdOrderByOrdreAsc(UUID dpgfId, UUID tenantId);

    List<DpgfNoeud> findByParentIdAndTenantIdOrderByOrdreAsc(UUID parentId, UUID tenantId);

    Optional<DpgfNoeud> findByIdAndTenantId(UUID id, UUID tenantId);

    void deleteByParentIdAndTenantId(UUID parentId, UUID tenantId);
}
