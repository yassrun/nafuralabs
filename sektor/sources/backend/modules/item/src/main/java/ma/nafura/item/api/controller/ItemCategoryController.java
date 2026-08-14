package ma.nafura.item.api.controller;

import ma.nafura.item.api.controller.base.ItemCategoryControllerBase;
import ma.nafura.item.service.ItemCategoryService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for ItemCategory entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/item-categories")
@SecuredResource(domain = "item", feature = "item", resource = "item-category")
public class ItemCategoryController extends ItemCategoryControllerBase {

    public ItemCategoryController(ItemCategoryService service) {
        super(service);
    }

    // Add custom endpoints here
}
