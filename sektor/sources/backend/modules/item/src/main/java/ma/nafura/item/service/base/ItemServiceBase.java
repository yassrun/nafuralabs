package ma.nafura.item.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.api.request.ItemCreateDto;
import ma.nafura.item.api.request.ItemUpdateDto;
import ma.nafura.item.mapper.ItemMapper;
import ma.nafura.item.repository.ItemRepository;

/**
 * Base service for Item entity.
 * Auto-generated from item.entity.json — do not edit.
 */
public class ItemServiceBase extends JpaCrudService<UUID, Item, ItemCreateDto, ItemUpdateDto> {
    protected ItemServiceBase(ItemRepository repository, ItemMapper mapper) {
        super(repository, mapper);
    }
}
