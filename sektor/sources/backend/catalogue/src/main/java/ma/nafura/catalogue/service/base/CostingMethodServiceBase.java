package ma.nafura.catalogue.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.catalogue.domain.stock.CostingMethod;
import ma.nafura.catalogue.api.request.CostingMethodCreateDto;
import ma.nafura.catalogue.api.request.CostingMethodUpdateDto;
import ma.nafura.catalogue.mapper.CostingMethodMapper;
import ma.nafura.catalogue.repository.CostingMethodRepository;

/**
 * Base service for CostingMethod entity.
 * Auto-generated from costing-method.entity.json — do not edit.
 */
public class CostingMethodServiceBase extends JpaCrudService<UUID, CostingMethod, CostingMethodCreateDto, CostingMethodUpdateDto> {
    protected CostingMethodServiceBase(CostingMethodRepository repository, CostingMethodMapper mapper) {
        super(repository, mapper);
    }
}
