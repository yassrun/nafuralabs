package ma.nafura.stock.service;

import java.util.List;
import ma.nafura.stock.domain.model.Location;
import ma.nafura.stock.mapper.LocationMapper;
import ma.nafura.stock.repository.LocationRepository;
import ma.nafura.stock.service.base.LocationServiceBase;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Custom service for Location entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class LocationService extends LocationServiceBase {

    private final LocationSeedService seedService;

    public LocationService(
            LocationRepository repository, LocationMapper mapper, LocationSeedService seedService) {
        super(repository, mapper);
        this.seedService = seedService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Location> listPage(int page, int size) {
        seedService.seedIfEmpty();
        return super.listPage(page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Location> listPage(int page, int size, Sort sort) {
        seedService.seedIfEmpty();
        return super.listPage(page, size, sort);
    }
}
