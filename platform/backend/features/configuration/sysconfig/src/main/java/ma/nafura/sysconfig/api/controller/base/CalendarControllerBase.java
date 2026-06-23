package ma.nafura.platform.configuration.sysconfig.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.platform.configuration.sysconfig.domain.model.Calendar;
import ma.nafura.platform.configuration.sysconfig.api.request.CalendarCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.CalendarUpdateDto;
import ma.nafura.platform.configuration.sysconfig.service.CalendarService;

/**
 * Base REST controller for Calendar entity.
 * Auto-generated from calendar.entity.json — do not edit.
 */
public abstract class CalendarControllerBase extends CrudController<UUID, Calendar, CalendarCreateDto, CalendarUpdateDto> {

    protected final CalendarService service;

    protected CalendarControllerBase(CalendarService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, Calendar, CalendarCreateDto, CalendarUpdateDto> getService() {
        return service;
    }
}


