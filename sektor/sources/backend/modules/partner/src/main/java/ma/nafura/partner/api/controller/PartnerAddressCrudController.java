package ma.nafura.partner.api.controller;

import ma.nafura.partner.api.controller.base.PartnerAddressControllerBase;
import ma.nafura.partner.service.PartnerAddressService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/partner-addresses")
@SecuredResource(domain = "partner", feature = "partner-address", resource = "partner-address")
public class PartnerAddressCrudController extends PartnerAddressControllerBase {

    public PartnerAddressCrudController(PartnerAddressService service) {
        super(service);
    }
}
