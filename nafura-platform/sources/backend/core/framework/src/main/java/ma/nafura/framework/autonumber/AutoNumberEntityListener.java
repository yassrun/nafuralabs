package ma.nafura.platform.framework.autonumber;

import jakarta.persistence.PrePersist;

/**
 * JPA entity listener that assigns auto-numbers to entities annotated with {@link AutoNumbered}
 * before persist. Uses {@link ApplicationContextProvider} to obtain the Spring-managed
 * {@link AutoNumberAssignmentService} because entity listeners are not Spring beans.
 */
public class AutoNumberEntityListener {

    @PrePersist
    public void prePersist(Object entity) {
        if (entity == null) {
            return;
        }
        if (!entity.getClass().isAnnotationPresent(AutoNumbered.class)) {
            return;
        }
        AutoNumberAssignmentService service = ApplicationContextProvider.getAutoNumberAssignmentService();
        if (service != null) {
            service.assignNumber(entity);
        }
    }
}
