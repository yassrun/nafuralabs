package ma.nafura.platform.configuration.sysconfig.api.controller;

import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.configuration.sysconfig.domain.model.Tag;
import ma.nafura.platform.configuration.sysconfig.repository.TagRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Configuration tags. Permissions: {@code settings.sysconfig.tag.{read,create,update,delete}}.
 */
@RestController
@RequestMapping("/api/v1/tags")
@SecuredResource(domain = "settings", feature = "sysconfig", resource = "tag")
public class TagController extends RecordController<Tag> {

    private final TagRepository repository;

    public TagController(TagRepository repository) {
        this.repository = repository;
    }

    @Override protected RecordRepository<Tag> repository() { return repository; }
    @Override protected String recordResource() { return "records/tag.json"; }
    @Override protected String labelField() { return "name"; }
    @Override protected Sort defaultSort() { return Sort.by(Sort.Direction.ASC, "code"); }

    @Override
    protected Map<String, String> validate(Tag tag, Tag previous) {
        UUID tenantId = TenantContext.getTenantId();
        String code = tag.getCode() == null ? "" : tag.getCode().trim();
        boolean taken = previous == null
                ? repository.existsByTenantIdAndCodeIgnoreCase(tenantId, code)
                : repository.existsByTenantIdAndCodeIgnoreCaseAndIdNot(tenantId, code, previous.getId());
        if (taken) {
            return Map.of("code", "Ce code existe déjà");
        }
        return Map.of();
    }

    @Override
    protected void beforeSave(Tag tag, Tag previous) {
        if (tag.getCode() != null) {
            tag.setCode(tag.getCode().trim());
        }
        if (tag.getName() != null) {
            tag.setName(tag.getName().trim());
        }
    }
}
