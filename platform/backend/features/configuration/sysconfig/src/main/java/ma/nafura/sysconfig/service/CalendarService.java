package ma.nafura.platform.configuration.sysconfig.service;

import ma.nafura.platform.configuration.sysconfig.mapper.CalendarMapper;
import ma.nafura.platform.configuration.sysconfig.repository.CalendarRepository;
import ma.nafura.platform.configuration.sysconfig.service.base.CalendarServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for Calendar entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class CalendarService extends CalendarServiceBase {
    public CalendarService(CalendarRepository repository, CalendarMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}

