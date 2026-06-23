package ma.nafura.item.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.item.domain.model.ItemCategory;
import ma.nafura.item.api.request.ItemCategoryCreateDto;
import ma.nafura.item.api.request.ItemCategoryUpdateDto;
import ma.nafura.item.mapper.ItemCategoryMapper;
import ma.nafura.item.repository.ItemCategoryRepository;

/**
 * Base service for ItemCategory entity.
 * Auto-generated from item-category.entity.json — do not edit.
 */
public class ItemCategoryServiceBase extends JpaCrudService<UUID, ItemCategory, ItemCategoryCreateDto, ItemCategoryUpdateDto> {
    protected ItemCategoryServiceBase(ItemCategoryRepository repository, ItemCategoryMapper mapper) {
        super(repository, mapper);
    }
}
