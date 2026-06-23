package ma.nafura.stock.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.stock.domain.model.Location;
import ma.nafura.stock.api.request.LocationCreateDto;
import ma.nafura.stock.api.request.LocationUpdateDto;
import ma.nafura.stock.mapper.LocationMapper;
import ma.nafura.stock.repository.LocationRepository;

/**
 * Base service for Location entity.
 * Auto-generated from location.entity.json — do not edit.
 */
public class LocationServiceBase extends JpaCrudService<UUID, Location, LocationCreateDto, LocationUpdateDto> {
    protected LocationServiceBase(LocationRepository repository, LocationMapper mapper) {
        super(repository, mapper);
    }
}
