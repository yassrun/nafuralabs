package ma.nafura.platform.collaboration.audit.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** One audit event of the organisation — append-only, listed by the read-only record API. */
@Entity
@Table(name = "audit_events", indexes = {
    @Index(name = "idx_audit_events_tenant_entity", columnList = "tenant_id, entity_type, entity_id"),
    @Index(name = "idx_audit_events_event_at", columnList = "event_at")
})
@Getter
@Setter
@NoArgsConstructor
public class AuditEvent extends TenantEntity {

    @Column(name = "entity_type", nullable = false, length = 80)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 100)
    private String entityId;

    @Column(name = "action", nullable = false, length = 80)
    private String action;

    @Column(name = "actor", nullable = false, length = 120)
    private String actor;

    @Column(name = "event_at", nullable = false)
    private OffsetDateTime eventAt;

    @Column(name = "details")
    private String details;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload")
    private Map<String, Object> payload;

    public static AuditEvent of(
            UUID tenantId,
            String entityType,
            String entityId,
            String action,
            String actor,
            OffsetDateTime eventAt,
            String details,
            Map<String, Object> payload) {
        AuditEvent event = new AuditEvent();
        event.setTenantId(tenantId);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setAction(action);
        event.setActor(actor);
        event.setEventAt(eventAt);
        event.setDetails(details);
        event.setPayload(payload);
        return event;
    }
}
