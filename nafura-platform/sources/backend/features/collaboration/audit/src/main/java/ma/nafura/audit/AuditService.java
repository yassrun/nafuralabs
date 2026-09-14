package ma.nafura.platform.collaboration.audit;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.collaboration.audit.domain.model.AuditEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditService {

    AuditEvent log(String entityType, String entityId, String action, Map<String, Object> payload);

    AuditEvent log(String entityType, String entityId, String action, String details, Map<String, Object> payload);

    default AuditEvent log(String entityType, UUID entityId, String action, Map<String, Object> payload) {
        return log(entityType, AuditableIds.ofUuid(entityId), action, payload);
    }

    default AuditEvent log(String entityType, UUID entityId, String action, String details, Map<String, Object> payload) {
        return log(entityType, AuditableIds.ofUuid(entityId), action, details, payload);
    }

    Page<AuditEvent> getTimeline(String entityType, String entityId, Pageable pageable);

    default Page<AuditEvent> getTimeline(String entityType, UUID entityId, Pageable pageable) {
        return getTimeline(entityType, AuditableIds.ofUuid(entityId), pageable);
    }

    Page<AuditEvent> getLog(AuditLogQuery query, Pageable pageable);

    List<String> getDistinctEntityTypes();
}
