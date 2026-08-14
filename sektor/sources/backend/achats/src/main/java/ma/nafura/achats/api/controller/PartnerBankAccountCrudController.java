package ma.nafura.achats.api.controller;

import ma.nafura.achats.api.controller.base.PartnerBankAccountControllerBase;
import ma.nafura.achats.service.PartnerBankAccountService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/partner-bank-accounts")
@SecuredResource(domain = "partner", feature = "partner-bank-account", resource = "partner-bank-account")
public class PartnerBankAccountCrudController extends PartnerBankAccountControllerBase {

    public PartnerBankAccountCrudController(PartnerBankAccountService service) {
        super(service);
    }
}
