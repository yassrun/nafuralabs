package ma.nafura.catalogue.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.catalogue.domain.model.UoMCategory;
import ma.nafura.catalogue.api.request.UoMCategoryCreateDto;
import ma.nafura.catalogue.api.request.UoMCategoryUpdateDto;
import ma.nafura.catalogue.mapper.UoMCategoryMapper;
import ma.nafura.catalogue.repository.UoMCategoryRepository;

/**
 * Base service for UoMCategory entity.
 * Auto-generated from uo-mcategory.entity.json — do not edit.
 */
public class UoMCategoryServiceBase extends JpaCrudService<UUID, UoMCategory, UoMCategoryCreateDto, UoMCategoryUpdateDto> {
    protected UoMCategoryServiceBase(UoMCategoryRepository repository, UoMCategoryMapper mapper) {
        super(repository, mapper);
    }
}
