package ma.nafura.platform.collaboration.comment.repository;

import ma.nafura.platform.collaboration.comment.domain.model.RecordComment;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecordCommentRepository extends TenantScopedRepository<RecordComment, UUID> {

    Page<RecordComment> findByTenantIdAndEntityTypeAndEntityIdAndParentIdIsNullOrderByCreatedAtAsc(
            UUID tenantId, String entityType, UUID entityId, Pageable pageable);

    List<RecordComment> findByTenantIdAndParentIdOrderByCreatedAtAsc(UUID tenantId, UUID parentId);
}


