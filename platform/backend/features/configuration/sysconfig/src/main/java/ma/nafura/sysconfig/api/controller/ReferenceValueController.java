package ma.nafura.platform.configuration.sysconfig.api.controller;

import ma.nafura.platform.configuration.sysconfig.api.controller.base.ReferenceValueControllerBase;
import ma.nafura.platform.configuration.sysconfig.service.ReferenceValueService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for ReferenceValue entity.
 * Generated once — add custom endpoints here.
 */
@RestController
@RequestMapping("/api/v1/reference-values")
@SecuredResource(domain = "settings", feature = "sysconfig", resource = "reference-value")
public class ReferenceValueController extends ReferenceValueControllerBase {

    public ReferenceValueController(ReferenceValueService service) {
        super(service);
    }

    // Add custom endpoints here
}


