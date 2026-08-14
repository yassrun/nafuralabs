package ma.nafura.catalogue.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.catalogue.domain.article.UnitOfMeasure;
import ma.nafura.catalogue.api.request.UnitOfMeasureCreateDto;
import ma.nafura.catalogue.api.request.UnitOfMeasureUpdateDto;
import ma.nafura.catalogue.service.UnitOfMeasureService;

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
