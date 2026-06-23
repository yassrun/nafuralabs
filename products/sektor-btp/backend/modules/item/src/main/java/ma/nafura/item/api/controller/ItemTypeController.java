package ma.nafura.item.api.controller;

import ma.nafura.item.api.controller.base.ItemTypeControllerBase;
import ma.nafura.item.service.ItemTypeService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for ItemType entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/item-types")
@SecuredResource(domain = "item", feature = "item", resource = "item-type")
public class ItemTypeController extends ItemTypeControllerBase {

    public ItemTypeController(ItemTypeService service) {
        super(service);
    }

    // Add custom endpoints here
}
