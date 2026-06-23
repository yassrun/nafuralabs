package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.PosteBudgetaire;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PosteBudgetaireRepository extends TenantScopedRepository<PosteBudgetaire, String> {

    List<PosteBudgetaire> findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(UUID tenantId, String lotId);

    Optional<PosteBudgetaire> findByTenantIdAndLotIdAndCode(UUID tenantId, String lotId, String code);

    long countByTenantId(UUID tenantId);
}
