package ma.nafura.item.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.item.domain.model.UoMCategory;
import ma.nafura.item.api.request.UoMCategoryCreateDto;
import ma.nafura.item.api.request.UoMCategoryUpdateDto;
import ma.nafura.item.service.UoMCategoryService;

/**
 * Base REST controller for UoMCategory entity.
 * Auto-generated from uo-mcategory.entity.json — do not edit.
 */
public abstract class UoMCategoryControllerBase extends CrudController<UUID, UoMCategory, UoMCategoryCreateDto, UoMCategoryUpdateDto> {

    protected final UoMCategoryService service;

    protected UoMCategoryControllerBase(UoMCategoryService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, UoMCategory, UoMCategoryCreateDto, UoMCategoryUpdateDto> getService() {
        return service;
    }
}
