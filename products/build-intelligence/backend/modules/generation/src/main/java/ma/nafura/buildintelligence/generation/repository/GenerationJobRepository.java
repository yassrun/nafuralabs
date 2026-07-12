package ma.nafura.buildintelligence.generation.repository;

import ma.nafura.buildintelligence.generation.domain.GenerationJob;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GenerationJobRepository extends TenantScopedRepository<GenerationJob, UUID> {
}
