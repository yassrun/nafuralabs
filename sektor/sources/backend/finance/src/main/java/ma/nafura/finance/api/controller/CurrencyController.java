package ma.nafura.finance.api.controller;

import ma.nafura.finance.api.controller.base.CurrencyControllerBase;
import ma.nafura.finance.service.CurrencyService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Currency entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/currencies")
@SecuredResource(domain = "currency", feature = "currency", resource = "currency")
public class CurrencyController extends CurrencyControllerBase {

    public CurrencyController(CurrencyService service) {
        super(service);
    }

    // Add custom endpoints here
}
