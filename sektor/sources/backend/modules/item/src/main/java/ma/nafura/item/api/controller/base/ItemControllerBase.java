package ma.nafura.item.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.api.request.ItemCreateDto;
import ma.nafura.item.api.request.ItemUpdateDto;
import ma.nafura.item.service.ItemService;

/**
 * Base REST controller for Item entity.
 * Auto-generated from item.entity.json — do not edit.
 */
public abstract class ItemControllerBase extends CrudController<UUID, Item, ItemCreateDto, ItemUpdateDto> {

    protected final ItemService service;

    protected ItemControllerBase(ItemService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, Item, ItemCreateDto, ItemUpdateDto> getService() {
        return service;
    }
}
