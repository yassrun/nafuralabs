package ma.nafura.item.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.item.domain.model.ItemType;
import ma.nafura.item.api.request.ItemTypeCreateDto;
import ma.nafura.item.api.request.ItemTypeUpdateDto;
import ma.nafura.item.service.ItemTypeService;

/**
 * Base REST controller for ItemType entity.
 * Auto-generated from item-type.entity.json — do not edit.
 */
public abstract class ItemTypeControllerBase extends CrudController<UUID, ItemType, ItemTypeCreateDto, ItemTypeUpdateDto> {

    protected final ItemTypeService service;

    protected ItemTypeControllerBase(ItemTypeService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, ItemType, ItemTypeCreateDto, ItemTypeUpdateDto> getService() {
        return service;
    }
}
