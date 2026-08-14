package ma.nafura.stock.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.stock.domain.model.CostingMethod;
import ma.nafura.stock.api.request.CostingMethodCreateDto;
import ma.nafura.stock.api.request.CostingMethodUpdateDto;
import ma.nafura.stock.mapper.CostingMethodMapper;
import ma.nafura.stock.repository.CostingMethodRepository;

/**
 * Base service for CostingMethod entity.
 * Auto-generated from costing-method.entity.json — do not edit.
 */
public class CostingMethodServiceBase extends JpaCrudService<UUID, CostingMethod, CostingMethodCreateDto, CostingMethodUpdateDto> {
    protected CostingMethodServiceBase(CostingMethodRepository repository, CostingMethodMapper mapper) {
        super(repository, mapper);
    }
}
