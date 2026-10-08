package ma.nafura.platform.configuration.sysconfig.api.controller;

import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.configuration.sysconfig.domain.model.ReferenceValue;
import ma.nafura.platform.configuration.sysconfig.repository.ReferenceValueRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Values of a code list. Permissions: {@code settings.sysconfig.reference-value.{read,create,update,delete}}.
 */
@RestController
@RequestMapping("/api/v1/reference-values")
@SecuredResource(domain = "settings", feature = "sysconfig", resource = "reference-value")
public class ReferenceValueController extends RecordController<ReferenceValue> {

    private final ReferenceValueRepository repository;

    public ReferenceValueController(ReferenceValueRepository repository) {
        this.repository = repository;
    }

    @Override protected RecordRepository<ReferenceValue> repository() { return repository; }
    @Override protected String recordResource() { return "records/reference-value.json"; }
    @Override protected String labelField() { return "name"; }
    @Override protected Sort defaultSort() { return Sort.by(Sort.Direction.ASC, "sortOrder", "code"); }

    @Override
    protected Map<String, String> validate(ReferenceValue value, ReferenceValue previous) {
        if (value.getCodeListId() == null) {
            return Map.of("codeListId", "Obligatoire");
        }
        UUID tenantId = TenantContext.getTenantId();
        String code = value.getCode() == null ? "" : value.getCode().trim();
        boolean taken = previous == null
                ? repository.existsByTenantIdAndCodeListIdAndCodeIgnoreCase(tenantId, value.getCodeListId(), code)
                : repository.existsByTenantIdAndCodeListIdAndCodeIgnoreCaseAndIdNot(
                        tenantId, value.getCodeListId(), code, previous.getId());
        if (taken) {
            return Map.of("code", "Ce code existe déjà dans la liste");
        }
        return Map.of();
    }

    @Override
    protected void beforeSave(ReferenceValue value, ReferenceValue previous) {
        if (value.getCode() != null) {
            value.setCode(value.getCode().trim());
        }
        if (value.getName() != null) {
            value.setName(value.getName().trim());
        }
    }
}
