package ma.nafura.platform.framework.autonumber;

import java.lang.reflect.Field;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Assigns auto-generated numbers to entities annotated with {@link AutoNumbered}.
 */
@Service
public class AutoNumberAssignmentService {

    private static final Logger log = LoggerFactory.getLogger(AutoNumberAssignmentService.class);

    private final Optional<NumberSequenceGenerator> generator;

    public AutoNumberAssignmentService(Optional<NumberSequenceGenerator> generator) {
        this.generator = generator != null ? generator : Optional.empty();
    }

    /**
     * If the entity class is {@link AutoNumbered} and conditions are met,
     * generates the next number and sets the target field. Graceful fallback:
     * if sequence is not found or tenant not set, logs a warning and does not block.
     */
    public void assignNumber(Object entity) {
        Class<?> entityClass = entity.getClass();
        AutoNumbered annotation = entityClass.getAnnotation(AutoNumbered.class);
        if (annotation == null) {
            return;
        }

        String fieldName = annotation.field();
        boolean onlyIfEmpty = annotation.onlyIfEmpty();

        if (onlyIfEmpty && !isFieldEmpty(entity, fieldName)) {
            return;
        }

        UUID tenantId = TenantContext.getTenantIdOrNull();
        if (tenantId == null) {
            log.warn("AutoNumbered entity {} has no tenant context; skipping number assignment", entityClass.getSimpleName());
            return;
        }

        if (generator.isEmpty()) {
            log.warn("No NumberSequenceGenerator available; skipping auto-number for {}", entityClass.getSimpleName());
            return;
        }

        Optional<String> next = generator.get().generateNextNumber(annotation.sequenceCode(), tenantId);
        if (next.isEmpty()) {
            log.warn("Numbering sequence '{}' not found for tenant {}; skipping auto-number for {}",
                annotation.sequenceCode(), tenantId, entityClass.getSimpleName());
            return;
        }

        setField(entity, fieldName, next.get());
    }

    private boolean isFieldEmpty(Object entity, String fieldName) {
        try {
            Field field = findField(entity.getClass(), fieldName);
            if (field == null) {
                return true;
            }
            field.setAccessible(true);
            Object value = field.get(entity);
            if (value == null) {
                return true;
            }
            return value.toString().isBlank();
        } catch (Exception e) {
            log.debug("Could not read field {} on {}: {}", fieldName, entity.getClass().getSimpleName(), e.getMessage());
            return true;
        }
    }

    private void setField(Object entity, String fieldName, String value) {
        try {
            Field field = findField(entity.getClass(), fieldName);
            if (field == null) {
                log.warn("Field {} not found on {}", fieldName, entity.getClass().getSimpleName());
                return;
            }
            field.setAccessible(true);
            field.set(entity, value);
        } catch (Exception e) {
            log.warn("Could not set field {} on {}: {}", fieldName, entity.getClass().getSimpleName(), e.getMessage());
        }
    }

    private static Field findField(Class<?> clazz, String name) {
        Class<?> current = clazz;
        while (current != null) {
            try {
                return current.getDeclaredField(name);
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            }
        }
        return null;
    }
}
