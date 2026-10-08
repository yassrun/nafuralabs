package ma.nafura.platform.collaboration.audit;

import java.util.List;

import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.audit.domain.model.AuditEvent;
import ma.nafura.platform.collaboration.audit.repository.AuditEventRepository;
import ma.nafura.platform.framework.record.ReadOnlyRecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Organisation-wide audit journal — read-only record.
 * Permissions: administration.audit.log.read.
 */
@RestController
@RequestMapping("/api/v1/platform/collaboration/audit/log")
@SecuredResource(domain = "administration", feature = "audit", resource = "log")
public class AuditLogController extends ReadOnlyRecordController<AuditEvent> {

    private final AuditEventRepository repository;
    private final AuditService auditService;

    public AuditLogController(AuditEventRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Override
    protected RecordRepository<AuditEvent> repository() {
        return repository;
    }

    @Override
    protected String recordResource() {
        return "records/audit-event.json";
    }

    @Override
    protected Sort defaultSort() {
        return Sort.by(Sort.Direction.DESC, "eventAt");
    }

    @GetMapping("/entity-types")
    @RequirePermission("read")
    public List<String> entityTypes() {
        return auditService.getDistinctEntityTypes();
    }
}
