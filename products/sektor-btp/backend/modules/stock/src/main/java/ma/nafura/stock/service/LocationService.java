package ma.nafura.stock.service;

import ma.nafura.stock.mapper.LocationMapper;
import ma.nafura.stock.repository.LocationRepository;
import ma.nafura.stock.service.base.LocationServiceBase;
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
