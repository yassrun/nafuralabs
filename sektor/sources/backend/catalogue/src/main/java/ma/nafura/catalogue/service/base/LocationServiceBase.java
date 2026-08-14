package ma.nafura.catalogue.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.catalogue.domain.stock.Location;
import ma.nafura.catalogue.api.request.LocationCreateDto;
import ma.nafura.catalogue.api.request.LocationUpdateDto;
import ma.nafura.catalogue.mapper.LocationMapper;
import ma.nafura.catalogue.repository.LocationRepository;

/**
 * Base service for Location entity.
 * Auto-generated from location.entity.json — do not edit.
 */
public class LocationServiceBase extends JpaCrudService<UUID, Location, LocationCreateDto, LocationUpdateDto> {
    protected LocationServiceBase(LocationRepository repository, LocationMapper mapper) {
        super(repository, mapper);
    }
}
