package ma.nafura.partner.api.controller;

import ma.nafura.partner.api.controller.base.PartnerContactControllerBase;
import ma.nafura.partner.service.PartnerContactService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/partner-contacts")
@SecuredResource(domain = "partner", feature = "partner-contact", resource = "partner-contact")
public class PartnerContactCrudController extends PartnerContactControllerBase {

    public PartnerContactCrudController(PartnerContactService service) {
        super(service);
    }
}
