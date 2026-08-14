package ma.nafura.platform.configuration.sysconfig.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.platform.configuration.sysconfig.domain.model.Calendar;
import ma.nafura.platform.configuration.sysconfig.api.request.CalendarCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.CalendarUpdateDto;
import ma.nafura.platform.configuration.sysconfig.mapper.CalendarMapper;
import ma.nafura.platform.configuration.sysconfig.repository.CalendarRepository;

/**
 * Base service for Calendar entity.
 * Auto-generated from calendar.entity.json — do not edit.
 */
public class CalendarServiceBase extends JpaCrudService<UUID, Calendar, CalendarCreateDto, CalendarUpdateDto> {
    protected CalendarServiceBase(CalendarRepository repository, CalendarMapper mapper) {
        super(repository, mapper);
    }
}


