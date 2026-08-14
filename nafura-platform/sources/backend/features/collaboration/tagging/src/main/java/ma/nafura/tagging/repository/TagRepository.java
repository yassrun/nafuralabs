package ma.nafura.platform.collaboration.tagging.repository;

import ma.nafura.platform.collaboration.tagging.domain.model.Tag;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository("taggingTagRepository")
public interface TagRepository extends TenantScopedRepository<Tag, UUID> {
}


