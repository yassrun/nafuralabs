package ma.nafura.item.api.controller;

import ma.nafura.item.api.controller.base.UnitOfMeasureControllerBase;
import ma.nafura.item.service.UnitOfMeasureService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for UnitOfMeasure entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/units-of-measure")
@SecuredResource(domain = "item", feature = "item", resource = "unit-of-measure")
public class UnitOfMeasureController extends UnitOfMeasureControllerBase {

    public UnitOfMeasureController(UnitOfMeasureService service) {
        super(service);
    }

    // Add custom endpoints here
}
