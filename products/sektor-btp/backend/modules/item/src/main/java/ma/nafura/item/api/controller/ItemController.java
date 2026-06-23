package ma.nafura.item.api.controller;

import java.util.UUID;
import ma.nafura.item.api.controller.base.ItemControllerBase;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.service.ItemService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Item entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/items")
@SecuredResource(domain = "item", feature = "item", resource = "item")
public class ItemController extends ItemControllerBase {

    private final ItemService itemService;

    public ItemController(ItemService service) {
        super(service);
        this.itemService = service;
    }

    @PostMapping("/{id}/recalc-pmp")
    @RequirePermission("item.item.recalc-pmp")
    public ResponseEntity<Item> recalcPmp(@PathVariable UUID id) {
        return ResponseEntity.ok(itemService.recalcPmp(id));
    }
}
