package ma.nafura.platform.configuration.sysconfig.service;

import ma.nafura.platform.configuration.sysconfig.mapper.CodeListMapper;
import ma.nafura.platform.configuration.sysconfig.repository.CodeListRepository;
import ma.nafura.platform.configuration.sysconfig.service.base.CodeListServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for CodeList entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class CodeListService extends CodeListServiceBase {
    public CodeListService(CodeListRepository repository, CodeListMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}

