package ma.nafura.platform.collaboration.audit;

import java.util.Collections;
import java.util.Map;
import ma.nafura.platform.framework.service.crud.CrudAuditHook;
import org.springframework.stereotype.Component;

/**
 * Audit hook for {@link ma.nafura.platform.framework.record.RecordController}
 * (and the deprecated {@code JpaCrudService} path still used by Sektor).
 * {@link AuditableHibernateInterceptor} covers other {@code save()} calls;
 * {@link AuditableCapture} dedupes both in the same transaction.
 */
@Component
public class CrudAuditHookImpl implements CrudAuditHook {

    private final AuditableCapture capture;

    public CrudAuditHookImpl(AuditableCapture capture) {
        this.capture = capture;
    }

    @Override
    public void afterCreate(Object entity) {
        if (AuditableCapture.meta(entity) == null) {
            return;
        }
        capture.afterCreate(entity);
    }

    @Override
    public Map<String, Object> beforeUpdate(Object entity) {
        if (AuditableCapture.meta(entity) == null) {
            return Collections.emptyMap();
        }
        return capture.beforeUpdate(entity);
    }

    @Override
    public void afterUpdate(Object entity, Map<String, Object> beforeSnapshot) {
        if (AuditableCapture.meta(entity) == null) {
            return;
        }
        capture.afterUpdate(entity, beforeSnapshot);
    }

    @Override
    public void afterDelete(Object entity) {
        if (AuditableCapture.meta(entity) == null) {
            return;
        }
        capture.afterDelete(entity);
    }
}
