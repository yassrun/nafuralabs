package ma.nafura.platform.framework.autonumber;

import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

/**
 * Provides static access to the Spring ApplicationContext for use in JPA entity listeners,
 * which are not managed by Spring and cannot receive dependency injection.
 */
@Component
public class ApplicationContextProvider implements ApplicationContextAware {

    private static ApplicationContext context;

    @Override
    public void setApplicationContext(@Nullable ApplicationContext applicationContext) {
        context = applicationContext;
    }

    public static ApplicationContext getContext() {
        return context;
    }

    @Nullable
    public static AutoNumberAssignmentService getAutoNumberAssignmentService() {
        if (context == null) {
            return null;
        }
        try {
            return context.getBean(AutoNumberAssignmentService.class);
        } catch (Exception e) {
            return null;
        }
    }
}
