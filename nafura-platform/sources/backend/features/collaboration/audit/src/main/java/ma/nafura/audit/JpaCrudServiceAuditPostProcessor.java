package ma.nafura.platform.collaboration.audit;

import ma.nafura.platform.framework.service.crud.CrudAuditHook;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

/**
 * Injects {@link CrudAuditHook} into every {@link JpaCrudService} bean so that
 * entities annotated with {@link ma.nafura.platform.framework.audit.Auditable}
 * are automatically audited on create/update/delete.
 *
 * @deprecated Héritage Sektor — supprimé avec sektor-sur-host. L'audit des records
 *             passe par {@link CrudAuditHook} depuis {@link ma.nafura.platform.framework.record.RecordController}.
 */
@Deprecated(since = "2026-10", forRemoval = true)
@Component
public class JpaCrudServiceAuditPostProcessor implements BeanPostProcessor {

    private final CrudAuditHook crudAuditHook;

    public JpaCrudServiceAuditPostProcessor(CrudAuditHook crudAuditHook) {
        this.crudAuditHook = crudAuditHook;
    }

    @Override
    public Object postProcessAfterInitialization(@NonNull Object bean, @NonNull String beanName) throws BeansException {
        if (bean instanceof JpaCrudService<?, ?, ?, ?> service) {
            service.setCrudAuditHook(crudAuditHook);
        }
        return bean;
    }
}
