package ma.nafura.platform.collaboration.notification.repository;

import ma.nafura.platform.collaboration.notification.domain.model.EmailTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, UUID>, JpaSpecificationExecutor<EmailTemplate> {

    Optional<EmailTemplate> findByCodeAndTenantIdIsNull(String code);

    Optional<EmailTemplate> findByCodeAndTenantId(String code, UUID tenantId);

    Page<EmailTemplate> findByTenantId(UUID tenantId, Pageable pageable);

    Page<EmailTemplate> findByTenantIdIsNullAndIsSystemTrue(Pageable pageable);

    @Query("SELECT e FROM EmailTemplate e WHERE e.entityType = :entityType AND (e.tenantId = :tenantId OR e.tenantId IS NULL) ORDER BY e.name")
    List<EmailTemplate> findByEntityTypeForTenant(@Param("entityType") String entityType, @Param("tenantId") UUID tenantId);

    @Query("SELECT e FROM EmailTemplate e WHERE (:system IS NULL OR e.isSystem = :system) AND (:entityType IS NULL OR e.entityType = :entityType) AND (e.tenantId = :tenantId OR e.tenantId IS NULL)")
    Page<EmailTemplate> findAllBySystemAndEntityTypeAndTenant(@Param("system") Boolean system, @Param("entityType") String entityType, @Param("tenantId") UUID tenantId, Pageable pageable);

    boolean existsByCodeAndTenantId(String code, UUID tenantId);

    boolean existsByCodeAndTenantIdIsNull(String code);
}
