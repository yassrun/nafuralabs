package ma.nafura.platform.framework.record;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import jakarta.annotation.PostConstruct;
import ma.nafura.platform.authorization.security.authorization.Confidential;
import ma.nafura.platform.authorization.security.authorization.PublicEndpoint;
import ma.nafura.platform.authorization.security.authorization.PublicField;
import ma.nafura.platform.framework.domain.TenantEntity;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

/**
 * Read-only public list and fiche. Only {@link PublicField}s are returned. A confidential record ({@link Confidential})
 * is withheld whole, like an unpublished one. The scope (aggregated or one organization) is the {@link PublicEndpoint} on the method.
 */
public abstract class PublicRecordController<E extends TenantEntity> {

    private static final int MAX_PAGE = 100;
    private static final Set<String> AUDIT = Set.of("createdBy", "updatedBy", "createdAt", "updatedAt", "tenantId");

    private Class<?> recordType;
    private List<Field> publicFields = List.of();
    private Field confidentialField;

    protected abstract RecordRepository<E> repository();

    /** The record is listed and readable. Unpublished records answer 404, including by id. */
    protected abstract boolean published(E record);

    protected Sort defaultSort() {
        return Sort.by("name");
    }

    @PostConstruct
    void checkProjection() {
        recordType = GenericTypeResolver.resolveTypeArgument(getClass(), PublicRecordController.class);
        if (recordType == null) {
            throw new IllegalStateException(getClass().getSimpleName() + " must declare its record type");
        }
        List<Field> fields = new ArrayList<>();
        for (Field field : recordType.getDeclaredFields()) {
            PublicField marker = field.getAnnotation(PublicField.class);
            if (marker == null) {
                continue;
            }
            if (AUDIT.contains(field.getName())) {
                throw new IllegalStateException(recordType.getSimpleName() + "." + field.getName() + " is an audit field and cannot be public");
            }
            field.setAccessible(true);
            fields.add(field);
            if (field.getAnnotation(Confidential.class) != null) {
                throw new IllegalStateException(field.getName() + " cannot be both public and the confidential condition");
            }
        }
        for (Field field : recordType.getDeclaredFields()) {
            if (field.getAnnotation(Confidential.class) != null) {
                if (confidentialField != null) {
                    throw new IllegalStateException(recordType.getSimpleName() + " has two confidential conditions");
                }
                field.setAccessible(true);
                confidentialField = field;
            }
        }
        publicFields = List.copyOf(fields);
    }

    @GetMapping
    @PublicEndpoint(scope = PublicEndpoint.Scope.AGGREGATED, reason = "Public catalogue")
    public Map<String, Object> list() {
        List<E> published = repository().findAll(defaultSort()).stream().filter(this::visible).limit(MAX_PAGE).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("content", published.stream().map(this::project).toList());
        body.put("totalElements", published.size());
        body.put("size", MAX_PAGE);
        return body;
    }

    @GetMapping("/{id}")
    @PublicEndpoint(scope = PublicEndpoint.Scope.AGGREGATED, reason = "Public fiche")
    public Map<String, Object> get(@PathVariable UUID id) {
        E record = repository().findById(id).filter(this::visible)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        return project(record);
    }

    /** Published and not confidential. */
    private boolean visible(E record) {
        return published(record) && !confidential(record);
    }

    private Map<String, Object> project(E record) {
        if (!visible(record)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
        }
        BeanWrapperImpl bean = new BeanWrapperImpl(record);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", record.getId());
        for (Field field : publicFields) {
            body.put(field.getName(), bean.getPropertyValue(field.getName()));
        }
        return body;
    }

    private boolean confidential(E record) {
        if (confidentialField == null) {
            return false;
        }
        try {
            Object value = confidentialField.get(record);
            return Boolean.TRUE.equals(value);
        } catch (IllegalAccessException e) {
            return false;
        }
    }
}
