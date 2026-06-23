package ma.nafura.platform.configuration.sysconfig.api.controller;

import ma.nafura.platform.configuration.sysconfig.api.controller.base.TagControllerBase;
import ma.nafura.platform.configuration.sysconfig.service.TagService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Tag entity.
 * Generated once — add custom endpoints here.
 */
@RestController
@RequestMapping("/api/v1/tags")
@SecuredResource(domain = "settings", feature = "sysconfig", resource = "tag")
public class TagController extends TagControllerBase {

    public TagController(TagService service) {
        super(service);
    }

    // Add custom endpoints here
}


