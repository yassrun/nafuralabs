package ma.nafura.item.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.item.domain.model.ItemPrice;
import ma.nafura.item.api.request.ItemPriceCreateDto;
import ma.nafura.item.api.request.ItemPriceUpdateDto;
import ma.nafura.item.service.ItemPriceService;

/**
 * Base REST controller for ItemPrice entity.
 * Auto-generated from item-price.entity.json — do not edit.
 */
public abstract class ItemPriceControllerBase extends CrudController<UUID, ItemPrice, ItemPriceCreateDto, ItemPriceUpdateDto> {

    protected final ItemPriceService service;

    protected ItemPriceControllerBase(ItemPriceService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, ItemPrice, ItemPriceCreateDto, ItemPriceUpdateDto> getService() {
        return service;
    }
}
