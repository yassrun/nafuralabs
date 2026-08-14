package ma.nafura.platform.collaboration.audit;

import ma.nafura.platform.collaboration.audit.domain.model.AuditEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface AuditService {

    AuditEvent log(String entityType, UUID entityId, String action, Map<String, Object> payload);

    AuditEvent log(String entityType, UUID entityId, String action, String details, Map<String, Object> payload);

    Page<AuditEvent> getTimeline(String entityType, UUID entityId, Pageable pageable);

    Page<AuditEvent> getLog(AuditLogQuery query, Pageable pageable);

    List<String> getDistinctEntityTypes();
}

