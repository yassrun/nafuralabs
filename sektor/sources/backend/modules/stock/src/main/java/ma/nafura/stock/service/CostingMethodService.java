package ma.nafura.stock.service;

import ma.nafura.stock.mapper.CostingMethodMapper;
import ma.nafura.stock.repository.CostingMethodRepository;
import ma.nafura.stock.service.base.CostingMethodServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for CostingMethod entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class CostingMethodService extends CostingMethodServiceBase {
    public CostingMethodService(CostingMethodRepository repository, CostingMethodMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}
