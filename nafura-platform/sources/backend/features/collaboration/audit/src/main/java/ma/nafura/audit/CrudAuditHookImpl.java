package ma.nafura.platform.collaboration.audit;

import java.util.Collections;
import java.util.Map;
import ma.nafura.platform.framework.audit.Auditable;
import ma.nafura.platform.framework.service.crud.CrudAuditHook;
import org.springframework.stereotype.Component;

/**
 * JpaCrudService path. The Hibernate interceptor covers custom {@code save()}
 * calls; {@link AuditableCapture} dedupes both in the same transaction.
 */
@Component
public class CrudAuditHookImpl implements CrudAuditHook {

    private final AuditableCapture capture;

    public CrudAuditHookImpl(AuditableCapture capture) {
        this.capture = capture;
    }

    @Override
    public void afterCreate(Object entity) {
        if (entity == null || entity.getClass().getAnnotation(Auditable.class) == null) {
            return;
        }
        capture.afterCreate(entity);
    }

    @Override
    public Map<String, Object> beforeUpdate(Object entity) {
        if (entity == null || entity.getClass().getAnnotation(Auditable.class) == null) {
            return Collections.emptyMap();
        }
        return capture.beforeUpdate(entity);
    }

    @Override
    public void afterUpdate(Object entity, Map<String, Object> beforeSnapshot) {
        if (entity == null || entity.getClass().getAnnotation(Auditable.class) == null) {
            return;
        }
        capture.afterUpdate(entity, beforeSnapshot);
    }

    @Override
    public void afterDelete(Object entity) {
        if (entity == null || entity.getClass().getAnnotation(Auditable.class) == null) {
            return;
        }
        capture.afterDelete(entity);
    }
}
