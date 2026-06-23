package ma.nafura.item.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.item.domain.model.UnitOfMeasure;
import ma.nafura.item.api.request.UnitOfMeasureCreateDto;
import ma.nafura.item.api.request.UnitOfMeasureUpdateDto;
import ma.nafura.item.service.UnitOfMeasureService;

/**
 * Base REST controller for UnitOfMeasure entity.
 * Auto-generated from unit-of-measure.entity.json — do not edit.
 */
public abstract class UnitOfMeasureControllerBase extends CrudController<UUID, UnitOfMeasure, UnitOfMeasureCreateDto, UnitOfMeasureUpdateDto> {

    protected final UnitOfMeasureService service;

    protected UnitOfMeasureControllerBase(UnitOfMeasureService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, UnitOfMeasure, UnitOfMeasureCreateDto, UnitOfMeasureUpdateDto> getService() {
        return service;
    }
}
