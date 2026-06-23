package ma.nafura.item.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.item.domain.model.ItemType;
import ma.nafura.item.api.request.ItemTypeCreateDto;
import ma.nafura.item.api.request.ItemTypeUpdateDto;
import ma.nafura.item.mapper.ItemTypeMapper;
import ma.nafura.item.repository.ItemTypeRepository;

/**
 * Base service for ItemType entity.
 * Auto-generated from item-type.entity.json — do not edit.
 */
public class ItemTypeServiceBase extends JpaCrudService<UUID, ItemType, ItemTypeCreateDto, ItemTypeUpdateDto> {
    protected ItemTypeServiceBase(ItemTypeRepository repository, ItemTypeMapper mapper) {
        super(repository, mapper);
    }
}
