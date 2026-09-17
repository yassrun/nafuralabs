package ma.nafura.platform.framework.domain;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.context.UserContext;

/**
 * Tenant-scoped platform entity with optional audit user references.
 */
@MappedSuperclass
@Getter
@Setter
public abstract class TenantEntity extends PlatformEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @PrePersist
    protected void onTenantPersist() {
        UUID userId = UserContext.getUserIdOrNull();
        if (userId != null) {
            if (this.createdBy == null) {
                this.createdBy = userId;
            }
            this.updatedBy = userId;
        }
    }

    @PreUpdate
    protected void onTenantUpdate() {
        UUID userId = UserContext.getUserIdOrNull();
        if (userId != null) {
            this.updatedBy = userId;
        }
    }
}
