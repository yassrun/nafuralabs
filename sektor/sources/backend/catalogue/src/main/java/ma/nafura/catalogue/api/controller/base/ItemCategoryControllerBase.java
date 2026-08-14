package ma.nafura.catalogue.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.catalogue.domain.model.ItemCategory;
import ma.nafura.catalogue.api.request.ItemCategoryCreateDto;
import ma.nafura.catalogue.api.request.ItemCategoryUpdateDto;
import ma.nafura.catalogue.service.ItemCategoryService;

/**
 * Base REST controller for ItemCategory entity.
 * Auto-generated from item-category.entity.json — do not edit.
 */
public abstract class ItemCategoryControllerBase extends CrudController<UUID, ItemCategory, ItemCategoryCreateDto, ItemCategoryUpdateDto> {

    protected final ItemCategoryService service;

    protected ItemCategoryControllerBase(ItemCategoryService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, ItemCategory, ItemCategoryCreateDto, ItemCategoryUpdateDto> getService() {
        return service;
    }
}
