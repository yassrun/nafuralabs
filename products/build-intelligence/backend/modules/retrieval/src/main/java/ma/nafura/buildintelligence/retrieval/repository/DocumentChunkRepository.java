package ma.nafura.buildintelligence.retrieval.repository;

import ma.nafura.buildintelligence.retrieval.domain.DocumentChunk;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentChunkRepository extends TenantScopedRepository<DocumentChunk, UUID> {

    @Query(value = """
            SELECT * FROM bi_document_chunk
            WHERE tenant_id = :tenantId
              AND to_tsvector('french', content) @@ plainto_tsquery('french', :query)
            ORDER BY ts_rank(to_tsvector('french', content), plainto_tsquery('french', :query)) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<DocumentChunk> searchFullText(@Param("tenantId") UUID tenantId,
                                       @Param("query") String query,
                                       @Param("limit") int limit);

    List<DocumentChunk> findByTenantIdAndDocumentIdOrderByChunkIndexAsc(UUID tenantId, UUID documentId);
}
