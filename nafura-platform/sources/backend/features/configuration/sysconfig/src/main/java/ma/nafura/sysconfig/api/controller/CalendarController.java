package ma.nafura.platform.configuration.sysconfig.api.controller;

import ma.nafura.platform.configuration.sysconfig.api.controller.base.CalendarControllerBase;
import ma.nafura.platform.configuration.sysconfig.service.CalendarService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Calendar entity.
 * Generated once — add custom endpoints here.
 */
@RestController
@RequestMapping("/api/v1/calendars")
@SecuredResource(domain = "settings", feature = "sysconfig", resource = "calendar")
public class CalendarController extends CalendarControllerBase {

    public CalendarController(CalendarService service) {
        super(service);
    }

    // Add custom endpoints here
}


