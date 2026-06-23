package ma.nafura.item.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.item.domain.model.UoMCategory;
import ma.nafura.item.api.request.UoMCategoryCreateDto;
import ma.nafura.item.api.request.UoMCategoryUpdateDto;
import ma.nafura.item.mapper.UoMCategoryMapper;
import ma.nafura.item.repository.UoMCategoryRepository;

/**
 * Base service for UoMCategory entity.
 * Auto-generated from uo-mcategory.entity.json — do not edit.
 */
public class UoMCategoryServiceBase extends JpaCrudService<UUID, UoMCategory, UoMCategoryCreateDto, UoMCategoryUpdateDto> {
    protected UoMCategoryServiceBase(UoMCategoryRepository repository, UoMCategoryMapper mapper) {
        super(repository, mapper);
    }
}
