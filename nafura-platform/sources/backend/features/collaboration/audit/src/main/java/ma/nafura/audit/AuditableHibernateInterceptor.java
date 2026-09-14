package ma.nafura.platform.collaboration.audit;

import java.util.HashMap;
import java.util.Map;
import ma.nafura.platform.framework.audit.Auditable;
import ma.nafura.platform.framework.autonumber.ApplicationContextProvider;
import org.hibernate.CallbackException;
import org.hibernate.Interceptor;
import org.hibernate.type.Type;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/**
 * Captures persist / dirty-flush / delete for {@link Auditable} entities that
 * do not go through {@code JpaCrudService}. Capture is resolved lazily to avoid
 * a JPA bootstrap cycle (interceptor → repository → EntityManagerFactory).
 */
@Component
public class AuditableHibernateInterceptor implements Interceptor {

    @Override
    public boolean onSave(
            Object entity,
            Object id,
            Object[] state,
            String[] propertyNames,
            Type[] types) throws CallbackException {
        AuditableCapture capture = capture();
        if (capture != null) {
            capture.afterCreate(entity, id);
        }
        return false;
    }

    @Override
    public boolean onFlushDirty(
            Object entity,
            Object id,
            Object[] currentState,
            Object[] previousState,
            String[] propertyNames,
            Type[] types) throws CallbackException {
        Auditable meta = AuditableCapture.meta(entity);
        if (meta == null || meta.trackedFields().length == 0) {
            return false;
        }
        AuditableCapture capture = capture();
        if (capture != null) {
            capture.afterUpdate(entity, stateMap(propertyNames, previousState), id);
        }
        return false;
    }

    @Override
    public void onDelete(
            Object entity,
            Object id,
            Object[] state,
            String[] propertyNames,
            Type[] types) throws CallbackException {
        AuditableCapture capture = capture();
        if (capture != null) {
            capture.afterDelete(entity, id);
        }
    }

    private static AuditableCapture capture() {
        ApplicationContext ctx = ApplicationContextProvider.getContext();
        if (ctx == null) {
            return null;
        }
        try {
            return ctx.getBean(AuditableCapture.class);
        } catch (Exception e) {
            return null;
        }
    }

    private static Map<String, Object> stateMap(String[] propertyNames, Object[] state) {
        Map<String, Object> map = new HashMap<>();
        if (propertyNames == null || state == null) {
            return map;
        }
        int n = Math.min(propertyNames.length, state.length);
        for (int i = 0; i < n; i++) {
            map.put(propertyNames[i], state[i]);
        }
        return map;
    }
}
