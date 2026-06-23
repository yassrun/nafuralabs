package ma.nafura.venuecatalog.job.adapter.persistence;

import ma.nafura.platform.jobrunner.JobStatus;
import ma.nafura.venuecatalog.job.domain.CatalogJobProvider;
import ma.nafura.venuecatalog.job.domain.CatalogJobType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CatalogJobRepository extends JpaRepository<CatalogJobEntity, UUID> {

    Optional<CatalogJobEntity> findByIdempotencyKey(String idempotencyKey);

    Page<CatalogJobEntity> findByStatus(JobStatus status, Pageable pageable);

    Page<CatalogJobEntity> findByType(CatalogJobType type, Pageable pageable);

    Page<CatalogJobEntity> findByProvider(CatalogJobProvider provider, Pageable pageable);
}
