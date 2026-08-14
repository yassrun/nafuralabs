package ma.nafura.catalogue.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.catalogue.domain.stock.CostingMethod;
import ma.nafura.catalogue.api.request.CostingMethodCreateDto;
import ma.nafura.catalogue.api.request.CostingMethodUpdateDto;
import ma.nafura.catalogue.service.CostingMethodService;

/**
 * Base REST controller for CostingMethod entity.
 * Auto-generated from costing-method.entity.json — do not edit.
 */
public abstract class CostingMethodControllerBase extends CrudController<UUID, CostingMethod, CostingMethodCreateDto, CostingMethodUpdateDto> {

    protected final CostingMethodService service;

    protected CostingMethodControllerBase(CostingMethodService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, CostingMethod, CostingMethodCreateDto, CostingMethodUpdateDto> getService() {
        return service;
    }
}
