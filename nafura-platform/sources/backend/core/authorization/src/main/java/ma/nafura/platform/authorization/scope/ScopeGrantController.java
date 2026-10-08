package ma.nafura.platform.authorization.scope;

import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ma.nafura.platform.framework.scope.ScopeGrant;
import ma.nafura.platform.framework.scope.ScopeGrantRepository;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.service.PermissionService;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.record.RecordCatalog;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;

/** Assigns a declared role to one scope node. Permissions: {@code tenant.members.scope-grant.*}. */
@RestController
@RequestMapping("/api/v1/platform/admin/scope-grants")
@SecuredResource(domain = "tenant", feature = "members", resource = "scope-grant")
public class ScopeGrantController extends RecordController<ScopeGrant> {

    private final ScopeGrantRepository repository;
    private final PermissionService permissions;
    private final RecordCatalog catalog;
    private final EntityManager entities;

    public ScopeGrantController(ScopeGrantRepository repository, PermissionService permissions, RecordCatalog catalog,
                                EntityManager entities) {
        this.repository = repository;
        this.permissions = permissions;
        this.catalog = catalog;
        this.entities = entities;
    }

    @Override
    protected RecordRepository<ScopeGrant> repository() {
        return repository;
    }

    @Override
    protected String recordResource() {
        return "records/scope-grant.json";
    }

    @Override
    protected String labelField() {
        return "roleCode";
    }

    @Override
    protected Sort defaultSort() {
        return Sort.by(Sort.Direction.ASC, "roleCode");
    }

    @Override
    protected void beforeSave(ScopeGrant record, ScopeGrant previous) {
        if (record.getRoleCode() != null) {
            record.setRoleCode(record.getRoleCode().trim().toUpperCase());
        }
        if (record.getEntity() != null) {
            record.setEntity(record.getEntity().trim());
        }
    }

    @Override
    protected Map<String, String> validate(ScopeGrant record, ScopeGrant previous) {
        Map<String, String> errors = new LinkedHashMap<>();
        RecordCatalog.Target target = record.getEntity() == null ? null : catalog.target(record.getEntity());
        if (target == null || target.descriptor().scope() == null || !target.descriptor().scope().node()) {
            errors.put("entity", "Pas un nœud de périmètre");
        } else if (record.getRecordId() != null) {
            Object found = entities.find(target.descriptor().type(), record.getRecordId());
            if (!(found instanceof TenantEntity row) || row.getTenantId() == null
                    || !row.getTenantId().equals(record.getTenantId())) {
                errors.put("recordId", "Enregistrement introuvable");
            }
        }
        if (record.getRoleCode() == null || !permissions.roleExists(record.getRoleCode())) {
            errors.put("roleCode", "Rôle inconnu");
        }
        return errors;
    }
}
