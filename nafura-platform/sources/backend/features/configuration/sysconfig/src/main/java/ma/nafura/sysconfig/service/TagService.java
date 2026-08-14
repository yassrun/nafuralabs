package ma.nafura.platform.configuration.sysconfig.service;

import ma.nafura.platform.configuration.sysconfig.mapper.TagMapper;
import ma.nafura.platform.configuration.sysconfig.repository.TagRepository;
import ma.nafura.platform.configuration.sysconfig.service.base.TagServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for Tag entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class TagService extends TagServiceBase {
    public TagService(TagRepository repository, TagMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}

