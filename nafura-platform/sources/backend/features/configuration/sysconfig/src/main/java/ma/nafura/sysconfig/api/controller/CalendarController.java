package ma.nafura.platform.configuration.sysconfig.api.controller;

import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.configuration.sysconfig.domain.model.Calendar;
import ma.nafura.platform.configuration.sysconfig.repository.CalendarRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Calendars. Permissions: {@code settings.sysconfig.calendar.{read,create,update,delete}}.
 */
@RestController
@RequestMapping("/api/v1/calendars")
@SecuredResource(domain = "settings", feature = "sysconfig", resource = "calendar")
public class CalendarController extends RecordController<Calendar> {

    private final CalendarRepository repository;

    public CalendarController(CalendarRepository repository) {
        this.repository = repository;
    }

    @Override protected RecordRepository<Calendar> repository() { return repository; }
    @Override protected String recordResource() { return "records/calendar.json"; }
    @Override protected String labelField() { return "name"; }
    @Override protected Sort defaultSort() { return Sort.by(Sort.Direction.ASC, "code"); }

    @Override
    protected Map<String, String> validate(Calendar calendar, Calendar previous) {
        UUID tenantId = TenantContext.getTenantId();
        String code = calendar.getCode() == null ? "" : calendar.getCode().trim();
        boolean taken = previous == null
                ? repository.existsByTenantIdAndCodeIgnoreCase(tenantId, code)
                : repository.existsByTenantIdAndCodeIgnoreCaseAndIdNot(tenantId, code, previous.getId());
        if (taken) {
            return Map.of("code", "Ce code existe déjà");
        }
        return Map.of();
    }

    @Override
    protected void beforeSave(Calendar calendar, Calendar previous) {
        if (calendar.getCode() != null) {
            calendar.setCode(calendar.getCode().trim());
        }
        if (calendar.getName() != null) {
            calendar.setName(calendar.getName().trim());
        }
        if (calendar.getIsActive() == null) {
            calendar.setIsActive(true);
        }
    }
}
