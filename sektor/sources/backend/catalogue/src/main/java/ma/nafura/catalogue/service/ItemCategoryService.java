package ma.nafura.catalogue.service;

import ma.nafura.catalogue.mapper.ItemCategoryMapper;
import ma.nafura.catalogue.repository.ItemCategoryRepository;
import ma.nafura.catalogue.service.base.ItemCategoryServiceBase;
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
