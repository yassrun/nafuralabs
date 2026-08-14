package ma.nafura.item.service;

import ma.nafura.item.mapper.ItemCategoryMapper;
import ma.nafura.item.repository.ItemCategoryRepository;
import ma.nafura.item.service.base.ItemCategoryServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for ItemCategory entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class ItemCategoryService extends ItemCategoryServiceBase {
    public ItemCategoryService(ItemCategoryRepository repository, ItemCategoryMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}
