package ma.nafura.etudes.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.dossier.DemandeCreationArticle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemandeCreationArticleRepository extends JpaRepository<DemandeCreationArticle, UUID> {

    List<DemandeCreationArticle> findByTenantIdAndDossierEtudeIdOrderByCreatedAtDesc(
            UUID tenantId, UUID dossierEtudeId);
}
