package ma.nafura.platform.configuration.sysconfig.api.controller;

import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.configuration.sysconfig.domain.model.CodeList;
import ma.nafura.platform.configuration.sysconfig.repository.CodeListRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Code lists. Permissions: {@code settings.sysconfig.code-list.{read,create,update,delete}}.
 */
@RestController
@RequestMapping("/api/v1/code-lists")
@SecuredResource(domain = "settings", feature = "sysconfig", resource = "code-list")
public class CodeListController extends RecordController<CodeList> {

    private final CodeListRepository repository;

    public CodeListController(CodeListRepository repository) {
        this.repository = repository;
    }

    @Override protected RecordRepository<CodeList> repository() { return repository; }
    @Override protected String recordResource() { return "records/code-list.json"; }
    @Override protected String labelField() { return "name"; }
    @Override protected Sort defaultSort() { return Sort.by(Sort.Direction.ASC, "code"); }

    @Override
    protected Map<String, String> validate(CodeList list, CodeList previous) {
        UUID tenantId = TenantContext.getTenantId();
        String code = list.getCode() == null ? "" : list.getCode().trim();
        boolean taken = previous == null
                ? repository.existsByTenantIdAndCodeIgnoreCase(tenantId, code)
                : repository.existsByTenantIdAndCodeIgnoreCaseAndIdNot(tenantId, code, previous.getId());
        if (taken) {
            return Map.of("code", "Ce code existe déjà");
        }
        return Map.of();
    }

    @Override
    protected void beforeSave(CodeList list, CodeList previous) {
        if (list.getCode() != null) {
            list.setCode(list.getCode().trim());
        }
        if (list.getName() != null) {
            list.setName(list.getName().trim());
        }
    }
}
