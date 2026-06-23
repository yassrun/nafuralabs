package ma.nafura.item.service;

import ma.nafura.item.mapper.UoMCategoryMapper;
import ma.nafura.item.repository.UoMCategoryRepository;
import ma.nafura.item.service.base.UoMCategoryServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for UoMCategory entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class UoMCategoryService extends UoMCategoryServiceBase {
    public UoMCategoryService(UoMCategoryRepository repository, UoMCategoryMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}
