package ma.nafura.item.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.item.domain.model.ItemCategory;
import ma.nafura.item.api.request.ItemCategoryCreateDto;
import ma.nafura.item.api.request.ItemCategoryUpdateDto;
import ma.nafura.item.service.ItemCategoryService;

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
