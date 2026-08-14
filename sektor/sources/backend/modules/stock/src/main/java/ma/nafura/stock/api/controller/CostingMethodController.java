package ma.nafura.stock.api.controller;

import ma.nafura.stock.api.controller.base.CostingMethodControllerBase;
import ma.nafura.stock.service.CostingMethodService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for CostingMethod entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/costing-methods")
@SecuredResource(domain = "stock", feature = "stock", resource = "costing-method")
public class CostingMethodController extends CostingMethodControllerBase {

    public CostingMethodController(CostingMethodService service) {
        super(service);
    }

    // Add custom endpoints here
}
