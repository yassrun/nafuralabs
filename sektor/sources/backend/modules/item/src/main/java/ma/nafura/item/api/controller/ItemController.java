package ma.nafura.item.api.controller;

import ma.nafura.item.api.controller.base.ItemControllerBase;
import ma.nafura.item.service.ItemService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Item entity.
 * Generated once — safe for manual edits.
 * PMP is maintained by stock ValorisationService — no manual recalc endpoint.
 */
@RestController
@RequestMapping("/api/v1/items")
@SecuredResource(domain = "item", feature = "item", resource = "item")
public class ItemController extends ItemControllerBase {

    public ItemController(ItemService service) {
        super(service);
    }
}
