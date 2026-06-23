package ma.nafura.platform.configuration.sysconfig.service;

import ma.nafura.platform.configuration.sysconfig.mapper.ReferenceValueMapper;
import ma.nafura.platform.configuration.sysconfig.repository.ReferenceValueRepository;
import ma.nafura.platform.configuration.sysconfig.service.base.ReferenceValueServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for ReferenceValue entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class ReferenceValueService extends ReferenceValueServiceBase {
    public ReferenceValueService(ReferenceValueRepository repository, ReferenceValueMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}

