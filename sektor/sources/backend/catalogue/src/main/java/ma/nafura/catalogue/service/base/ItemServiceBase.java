package ma.nafura.catalogue.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.catalogue.domain.model.Item;
import ma.nafura.catalogue.api.request.ItemCreateDto;
import ma.nafura.catalogue.api.request.ItemUpdateDto;
import ma.nafura.catalogue.mapper.ItemMapper;
import ma.nafura.catalogue.repository.ItemRepository;

/**
 * Base service for Item entity.
 * Auto-generated from item.entity.json — do not edit.
 */
public class ItemServiceBase extends JpaCrudService<UUID, Item, ItemCreateDto, ItemUpdateDto> {
    protected ItemServiceBase(ItemRepository repository, ItemMapper mapper) {
        super(repository, mapper);
    }
}
