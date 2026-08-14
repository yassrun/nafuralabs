package ma.nafura.catalogue.service;

import ma.nafura.catalogue.mapper.LocationMapper;
import ma.nafura.catalogue.repository.LocationRepository;
import ma.nafura.catalogue.service.base.LocationServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for Location entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class LocationService extends LocationServiceBase {
    public LocationService(LocationRepository repository, LocationMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}
