package ma.nafura.item.api.controller;

import ma.nafura.item.api.controller.base.ItemPriceControllerBase;
import ma.nafura.item.service.ItemPriceService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for ItemPrice entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/item-prices")
@SecuredResource(domain = "item", feature = "item", resource = "item-price")
public class ItemPriceController extends ItemPriceControllerBase {

    public ItemPriceController(ItemPriceService service) {
        super(service);
    }

    // Add custom endpoints here
}
