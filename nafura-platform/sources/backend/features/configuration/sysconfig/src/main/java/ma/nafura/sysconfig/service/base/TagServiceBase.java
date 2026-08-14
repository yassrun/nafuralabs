package ma.nafura.platform.configuration.sysconfig.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.platform.configuration.sysconfig.domain.model.Tag;
import ma.nafura.platform.configuration.sysconfig.api.request.TagCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.TagUpdateDto;
import ma.nafura.platform.configuration.sysconfig.mapper.TagMapper;
import ma.nafura.platform.configuration.sysconfig.repository.TagRepository;

/**
 * Base service for Tag entity.
 * Auto-generated from tag.entity.json — do not edit.
 */
public class TagServiceBase extends JpaCrudService<UUID, Tag, TagCreateDto, TagUpdateDto> {
    protected TagServiceBase(TagRepository repository, TagMapper mapper) {
        super(repository, mapper);
    }
}


