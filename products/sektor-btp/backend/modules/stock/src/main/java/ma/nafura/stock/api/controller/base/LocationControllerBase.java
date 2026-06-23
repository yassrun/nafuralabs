package ma.nafura.stock.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.stock.domain.model.Location;
import ma.nafura.stock.api.request.LocationCreateDto;
import ma.nafura.stock.api.request.LocationUpdateDto;
import ma.nafura.stock.service.LocationService;

/**
 * Base REST controller for Location entity.
 * Auto-generated from location.entity.json — do not edit.
 */
public abstract class LocationControllerBase extends CrudController<UUID, Location, LocationCreateDto, LocationUpdateDto> {

    protected final LocationService service;

    protected LocationControllerBase(LocationService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, Location, LocationCreateDto, LocationUpdateDto> getService() {
        return service;
    }
}
