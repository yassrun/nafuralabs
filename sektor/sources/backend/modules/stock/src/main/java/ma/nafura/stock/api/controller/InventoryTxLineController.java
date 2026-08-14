package ma.nafura.stock.api.controller;

import ma.nafura.stock.api.controller.base.InventoryTxLineControllerBase;
import ma.nafura.stock.service.InventoryTxLineService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for InventoryTxLine entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/inventory-tx-lines")
@SecuredResource(domain = "stock", feature = "stock", resource = "inventory-tx-line")
public class InventoryTxLineController extends InventoryTxLineControllerBase {

    public InventoryTxLineController(InventoryTxLineService service) {
        super(service);
    }

    // Add custom endpoints here
}
