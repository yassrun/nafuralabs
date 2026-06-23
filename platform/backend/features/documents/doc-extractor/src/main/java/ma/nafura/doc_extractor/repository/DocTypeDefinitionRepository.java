package ma.nafura.platform.documents.docextractor.repository;

import ma.nafura.platform.documents.docextractor.domain.model.DocTypeDefinition;
import ma.nafura.platform.documents.docextractor.domain.model.DocTypeDefinition.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocTypeDefinitionRepository extends JpaRepository<DocTypeDefinition, UUID> {

    // ===== Legacy queries (for backwards compatibility) =====

    List<DocTypeDefinition> findByDomainKeyAndIsActiveTrueOrderByDocTypeKeyAscVersionDesc(String domainKey);

    Optional<DocTypeDefinition> findFirstByDomainKeyAndDocTypeKeyAndIsActiveTrueOrderByVersionDesc(
            String domainKey,
            String docTypeKey
    );

    List<DocTypeDefinition> findByIsActiveTrueOrderByDomainKeyAscDocTypeKeyAscVersionDesc();

    // ===== New versioning workflow queries =====

    /**
     * Find the latest published version for a domain/docType combination.
     */
    Optional<DocTypeDefinition> findFirstByDomainKeyAndDocTypeKeyAndStatusOrderByVersionDesc(
            String domainKey,
            String docTypeKey,
            Status status
    );

    /**
     * Find all versions of a docType, ordered by version descending.
     */
    List<DocTypeDefinition> findByDomainKeyAndDocTypeKeyOrderByVersionDesc(
            String domainKey,
            String docTypeKey
    );

    /**
     * Find the maximum version number for a docType.
     */
    @Query("SELECT MAX(d.version) FROM DocTypeDefinition d WHERE d.domainKey = :domainKey AND d.docTypeKey = :docTypeKey")
    Optional<Integer> findMaxVersionByDomainKeyAndDocTypeKey(
            @Param("domainKey") String domainKey,
            @Param("docTypeKey") String docTypeKey
    );

    /**
     * Check if a draft exists for a domain/docType.
     */
    boolean existsByDomainKeyAndDocTypeKeyAndStatus(
            String domainKey,
            String docTypeKey,
            Status status
    );

    /**
     * Find all published docTypes, grouped by domain.
     */
    List<DocTypeDefinition> findByStatusOrderByDomainKeyAscDocTypeKeyAscVersionDesc(
            Status status
    );

    /**
     * Find all docTypes for a domain with a specific status.
     */
    List<DocTypeDefinition> findByDomainKeyAndStatusOrderByDocTypeKeyAscVersionDesc(
            String domainKey,
            Status status
    );

    /**
     * Find distinct domain keys.
     */
    @Query("SELECT DISTINCT d.domainKey FROM DocTypeDefinition d ORDER BY d.domainKey")
    List<String> findDistinctDomainKeys();

    /**
     * Find distinct docType keys for a domain.
     */
    @Query("SELECT DISTINCT d.docTypeKey FROM DocTypeDefinition d WHERE d.domainKey = :domainKey ORDER BY d.docTypeKey")
    List<String> findDistinctDocTypeKeysByDomainKey(
            @Param("domainKey") String domainKey
    );

    // ===== Origin-based queries (SYSTEM vs TENANT doc types) =====

    /**
     * Find all published SYSTEM doc types (visible to all tenants).
     */
    @Query("SELECT d FROM DocTypeDefinition d WHERE d.origin = 'SYSTEM' AND d.status = 'PUBLISHED' ORDER BY d.domainKey, d.docTypeKey, d.version DESC")
    List<DocTypeDefinition> findSystemDocTypes();

    /**
     * Find all published doc types for a specific tenant (SYSTEM + tenant's own).
     */
    @Query("SELECT d FROM DocTypeDefinition d WHERE d.status = 'PUBLISHED' AND (d.origin = 'SYSTEM' OR d.tenantId = :tenantId) ORDER BY d.domainKey, d.docTypeKey, d.version DESC")
    List<DocTypeDefinition> findPublishedForTenant(@Param("tenantId") UUID tenantId);

    /**
     * Find all doc types owned by a specific tenant (for management UI).
     */
    @Query("SELECT d FROM DocTypeDefinition d WHERE d.origin = 'TENANT' AND d.tenantId = :tenantId ORDER BY d.domainKey, d.docTypeKey, d.version DESC")
    List<DocTypeDefinition> findByTenantId(@Param("tenantId") UUID tenantId);
}

