package ma.nafura.platform.authorization.scope;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import ma.nafura.platform.framework.scope.DataScope;
import ma.nafura.platform.framework.scope.RecordScope;
import ma.nafura.platform.framework.scope.ScopeClosure;
import ma.nafura.platform.framework.scope.ScopeGrant;
import ma.nafura.platform.framework.scope.ScopeGrantRepository;
import ma.nafura.platform.authorization.service.PermissionService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.record.RecordCatalog;
import ma.nafura.platform.framework.record.RecordDescriptor;

/** Grants loaded for the caller, applied as a closure over the scope node declared by the record. */
@Service
public class DataScopeService implements DataScope {

    private final ScopeGrantRepository grants;
    private final PermissionService permissions;
    private final RecordCatalog catalog;
    private final EntityManager entities;

    public DataScopeService(ScopeGrantRepository grants, PermissionService permissions, RecordCatalog catalog,
                            EntityManager entities) {
        this.grants = grants;
        this.permissions = permissions;
        this.catalog = catalog;
        this.entities = entities;
    }

    @Override
    public boolean unrestricted(String permission) {
        return permission != null && UserContext.hasPermission(permission);
    }

    @Override
    public boolean admits(String permission, Class<?> controller) {
        if (unrestricted(permission)) {
            return true;
        }
        RecordCatalog.Target target = catalog.controller(controller);
        if (target == null || target.descriptor().scope() == null) {
            return false;
        }
        return granted(permission);
    }

    @Override
    public boolean granted(String permission) {
        if (unrestricted(permission)) {
            return true;
        }
        return rows().stream().anyMatch(grant -> permissions.hasPermission(grant.getRoleCode(), permission));
    }

    @Override
    public <T> Specification<T> restriction(String entity, String permission) {
        RecordScope scope = scopeOf(entity);
        if (scope == null || unrestricted(permission)) {
            return null;
        }
        Set<UUID> ids = scope.node()
                ? closure(entity, scope.parent(), permission)
                : closure(scope.of(), parentOf(scope.of()), permission);
        String field = scope.node() ? "id" : scope.field();
        return (root, query, cb) -> ids.isEmpty() ? cb.disjunction() : root.get(field).in(ids);
    }

    @Override
    public boolean visible(String entity, UUID id, Object record, String permission) {
        RecordScope scope = scopeOf(entity);
        if (scope == null || unrestricted(permission)) {
            return true;
        }
        if (scope.node()) {
            return id != null && closure(entity, scope.parent(), permission).contains(id);
        }
        UUID ref = reference(record != null ? record : load(entity, id), scope.field());
        return ref != null && closure(scope.of(), parentOf(scope.of()), permission).contains(ref);
    }

    @Override
    public void assertPlaced(String entity, Object record, String permission) {
        RecordScope scope = scopeOf(entity);
        if (scope == null || unrestricted(permission) || record == null) {
            return;
        }
        if (scope.node()) {
            Set<UUID> visible = closure(entity, scope.parent(), permission);
            UUID parent = scope.parent() == null ? null : reference(record, scope.parent());
            if (parent == null) {
                UUID id = record instanceof TenantEntity row ? row.getId() : null;
                if (id == null || !visible.contains(id)) {
                    throw refused();
                }
                return;
            }
            if (!visible.contains(parent)) {
                throw refused();
            }
            return;
        }
        UUID ref = reference(record, scope.field());
        if (ref == null || !closure(scope.of(), parentOf(scope.of()), permission).contains(ref)) {
            throw refused();
        }
    }

    private RecordScope scopeOf(String entity) {
        RecordCatalog.Target target = entity == null ? null : catalog.target(entity);
        RecordDescriptor descriptor = target == null ? null : target.descriptor();
        return descriptor == null ? null : descriptor.scope();
    }

    private String parentOf(String entity) {
        RecordScope scope = scopeOf(entity);
        return scope == null ? null : scope.parent();
    }

    private Set<UUID> closure(String entity, String parentField, String permission) {
        RecordCatalog.Target target = catalog.target(entity);
        if (target == null) {
            return Set.of();
        }
        UUID tenantId = TenantContext.getTenantIdOrNull();
        if (tenantId == null) {
            return Set.of();
        }
        List<UUID> roots = rows().stream()
                .filter(grant -> entity.equals(grant.getEntity()))
                .filter(grant -> permissions.hasPermission(grant.getRoleCode(), permission))
                .map(ScopeGrant::getRecordId)
                .toList();
        return ScopeClosure.descendants(nodes(target.descriptor().type(), parentField, tenantId), roots);
    }

    private Map<UUID, UUID> nodes(Class<?> type, String parentField, UUID tenantId) {
        CriteriaBuilder cb = entities.getCriteriaBuilder();
        CriteriaQuery<Tuple> query = cb.createTupleQuery();
        Root<?> root = query.from(type);
        if (parentField == null) {
            query.multiselect(root.get("id"));
        } else {
            query.multiselect(root.get("id"), root.get(parentField));
        }
        query.where(cb.equal(root.get("tenantId"), tenantId));
        Map<UUID, UUID> parentById = new LinkedHashMap<>();
        for (Tuple tuple : entities.createQuery(query).getResultList()) {
            UUID id = tuple.get(0, UUID.class);
            UUID parent = parentField == null ? null : tuple.get(1, UUID.class);
            parentById.put(id, parent);
        }
        return parentById;
    }

    private Object load(String entity, UUID id) {
        RecordCatalog.Target target = catalog.target(entity);
        if (target == null || id == null) {
            return null;
        }
        return entities.find(target.descriptor().type(), id);
    }

    private static UUID reference(Object record, String field) {
        if (record == null || field == null) {
            return null;
        }
        Object value = new BeanWrapperImpl(record).getPropertyValue(field);
        return value instanceof UUID id ? id : null;
    }

    private List<ScopeGrant> rows() {
        UUID tenantId = TenantContext.getTenantIdOrNull();
        UUID userId = UserContext.getUserIdOrNull();
        if (tenantId == null || userId == null) {
            return List.of();
        }
        return grants.findByTenantIdAndUserId(tenantId, userId);
    }

    private static ResponseStatusException refused() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "Hors périmètre");
    }
}
