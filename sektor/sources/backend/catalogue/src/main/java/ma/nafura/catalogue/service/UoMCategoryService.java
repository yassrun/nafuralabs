package ma.nafura.catalogue.service;

import ma.nafura.catalogue.mapper.UoMCategoryMapper;
import ma.nafura.catalogue.repository.UoMCategoryRepository;
import ma.nafura.catalogue.service.base.UoMCategoryServiceBase;
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
