package ma.nafura.item.service;

import ma.nafura.item.mapper.UnitOfMeasureMapper;
import ma.nafura.item.repository.UnitOfMeasureRepository;
import ma.nafura.item.service.base.UnitOfMeasureServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for UnitOfMeasure entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class UnitOfMeasureService extends UnitOfMeasureServiceBase {
    public UnitOfMeasureService(UnitOfMeasureRepository repository, UnitOfMeasureMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}
