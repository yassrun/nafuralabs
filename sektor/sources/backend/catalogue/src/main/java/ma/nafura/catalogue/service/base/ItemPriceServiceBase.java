package ma.nafura.catalogue.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.catalogue.domain.article.ItemPrice;
import ma.nafura.catalogue.api.request.ItemPriceCreateDto;
import ma.nafura.catalogue.api.request.ItemPriceUpdateDto;
import ma.nafura.catalogue.mapper.ItemPriceMapper;
import ma.nafura.catalogue.repository.ItemPriceRepository;

/**
 * Base service for ItemPrice entity.
 * Auto-generated from item-price.entity.json — do not edit.
 */
public class ItemPriceServiceBase extends JpaCrudService<UUID, ItemPrice, ItemPriceCreateDto, ItemPriceUpdateDto> {
    protected ItemPriceServiceBase(ItemPriceRepository repository, ItemPriceMapper mapper) {
        super(repository, mapper);
    }
}
