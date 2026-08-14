package ma.nafura.catalogue.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.catalogue.domain.article.ItemPrice;
import ma.nafura.catalogue.api.request.ItemPriceCreateDto;
import ma.nafura.catalogue.api.request.ItemPriceUpdateDto;
import ma.nafura.catalogue.service.ItemPriceService;

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
