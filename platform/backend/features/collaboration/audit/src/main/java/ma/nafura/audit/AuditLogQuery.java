package ma.nafura.platform.collaboration.audit;

import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;

/**
 * Query parameters for the global admin audit log.
 */
@Value
@Builder
public class AuditLogQuery {
    String search;
    String entityType;
    String action;
    String actor;
    OffsetDateTime from;
    OffsetDateTime to;
}
