package ma.nafura.item.api.controller;

import ma.nafura.item.api.controller.base.UoMCategoryControllerBase;
import ma.nafura.item.service.UoMCategoryService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for UoMCategory entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/uom-categories")
@SecuredResource(domain = "item", feature = "item", resource = "uo-mcategory")
public class UoMCategoryController extends UoMCategoryControllerBase {

    public UoMCategoryController(UoMCategoryService service) {
        super(service);
    }

    // Add custom endpoints here
}
