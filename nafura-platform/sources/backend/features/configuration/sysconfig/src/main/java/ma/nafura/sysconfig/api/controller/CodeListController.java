package ma.nafura.platform.configuration.sysconfig.api.controller;

import ma.nafura.platform.configuration.sysconfig.api.controller.base.CodeListControllerBase;
import ma.nafura.platform.configuration.sysconfig.service.CodeListService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for CodeList entity.
 * Generated once — add custom endpoints here.
 */
@RestController
@RequestMapping("/api/v1/code-lists")
@SecuredResource(domain = "settings", feature = "sysconfig", resource = "code-list")
public class CodeListController extends CodeListControllerBase {

    public CodeListController(CodeListService service) {
        super(service);
    }

    // Add custom endpoints here
}


