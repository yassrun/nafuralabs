package ma.nafura.buildintelligence.documents.repository;

import ma.nafura.buildintelligence.documents.domain.KnowledgeDocument;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface KnowledgeDocumentRepository extends TenantScopedRepository<KnowledgeDocument, UUID> {

    Optional<KnowledgeDocument> findByTenantIdAndSha256(UUID tenantId, String sha256);

    boolean existsByTenantIdAndSha256(UUID tenantId, String sha256);
}
