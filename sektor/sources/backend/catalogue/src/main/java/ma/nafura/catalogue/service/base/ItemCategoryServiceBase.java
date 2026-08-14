package ma.nafura.catalogue.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.catalogue.domain.model.ItemCategory;
import ma.nafura.catalogue.api.request.ItemCategoryCreateDto;
import ma.nafura.catalogue.api.request.ItemCategoryUpdateDto;
import ma.nafura.catalogue.mapper.ItemCategoryMapper;
import ma.nafura.catalogue.repository.ItemCategoryRepository;

/**
 * Base service for ItemCategory entity.
 * Auto-generated from item-category.entity.json — do not edit.
 */
public class ItemCategoryServiceBase extends JpaCrudService<UUID, ItemCategory, ItemCategoryCreateDto, ItemCategoryUpdateDto> {
    protected ItemCategoryServiceBase(ItemCategoryRepository repository, ItemCategoryMapper mapper) {
        super(repository, mapper);
    }
}
