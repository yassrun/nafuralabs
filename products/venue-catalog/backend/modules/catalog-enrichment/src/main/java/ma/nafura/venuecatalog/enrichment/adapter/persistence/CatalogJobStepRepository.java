package ma.nafura.venuecatalog.enrichment.adapter.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CatalogJobStepRepository extends JpaRepository<CatalogJobStepEntity, UUID> {
    List<CatalogJobStepEntity> findByJobIdOrderByCreatedAtAsc(UUID jobId);
    List<CatalogJobStepEntity> findByJobIdAndCatalogPlaceIdOrderByCreatedAtAsc(UUID jobId, UUID catalogPlaceId);
    Optional<CatalogJobStepEntity> findFirstByJobIdAndCatalogPlaceIdAndStepTypeOrderByAttemptCountDesc(
            UUID jobId, UUID catalogPlaceId, String stepType);
}
