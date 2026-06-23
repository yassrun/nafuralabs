package ma.nafura.item.service;

import ma.nafura.item.mapper.ItemTypeMapper;
import ma.nafura.item.repository.ItemTypeRepository;
import ma.nafura.item.service.base.ItemTypeServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for ItemType entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class ItemTypeService extends ItemTypeServiceBase {
    public ItemTypeService(ItemTypeRepository repository, ItemTypeMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}
