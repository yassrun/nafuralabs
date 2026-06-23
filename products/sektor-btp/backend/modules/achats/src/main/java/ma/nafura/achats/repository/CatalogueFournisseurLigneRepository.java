package ma.nafura.achats.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CatalogueFournisseurLigneRepository
        extends TenantScopedRepository<CatalogueFournisseurLigne, UUID> {

    List<CatalogueFournisseurLigne> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<CatalogueFournisseurLigne> findByTenantIdAndFournisseurIdOrderByDesignationAsc(
            UUID tenantId, String fournisseurId);

    List<CatalogueFournisseurLigne> findByTenantIdAndArticleIdOrderByDesignationAsc(
            UUID tenantId, String articleId);

    List<CatalogueFournisseurLigne> findByTenantIdAndFournisseurIdAndActifTrueOrderByDesignationAsc(
            UUID tenantId, String fournisseurId);

    Optional<CatalogueFournisseurLigne> findByTenantIdAndFournisseurIdAndArticleId(
            UUID tenantId, String fournisseurId, String articleId);

    boolean existsByTenantIdAndFournisseurIdAndArticleId(
            UUID tenantId, String fournisseurId, String articleId);
}
