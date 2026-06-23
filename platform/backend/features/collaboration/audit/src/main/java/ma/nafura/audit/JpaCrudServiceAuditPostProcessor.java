package ma.nafura.platform.collaboration.audit;

import ma.nafura.platform.framework.service.crud.CrudAuditHook;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

/**
 * Injects {@link CrudAuditHook} into every {@link JpaCrudService} bean so that
 * entities annotated with {@link Auditable} are automatically audited on create/update/delete.
 */
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
