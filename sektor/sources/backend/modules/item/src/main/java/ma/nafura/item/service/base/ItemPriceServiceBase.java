package ma.nafura.item.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.item.domain.model.ItemPrice;
import ma.nafura.item.api.request.ItemPriceCreateDto;
import ma.nafura.item.api.request.ItemPriceUpdateDto;
import ma.nafura.item.mapper.ItemPriceMapper;
import ma.nafura.item.repository.ItemPriceRepository;

/**
 * Base service for ItemPrice entity.
 * Auto-generated from item-price.entity.json — do not edit.
 */
public class ItemPriceServiceBase extends JpaCrudService<UUID, ItemPrice, ItemPriceCreateDto, ItemPriceUpdateDto> {
    protected ItemPriceServiceBase(ItemPriceRepository repository, ItemPriceMapper mapper) {
        super(repository, mapper);
    }
}
