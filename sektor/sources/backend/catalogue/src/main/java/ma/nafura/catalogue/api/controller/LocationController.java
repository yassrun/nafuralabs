package ma.nafura.catalogue.api.controller;

import ma.nafura.catalogue.api.controller.base.LocationControllerBase;
import ma.nafura.catalogue.service.LocationService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Location entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/locations")
@SecuredResource(domain = "stock", feature = "stock", resource = "location")
public class LocationController extends LocationControllerBase {

    public LocationController(LocationService service) {
        super(service);
    }

    // Add custom endpoints here
}
