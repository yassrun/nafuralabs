package ma.nafura.platform.configuration.sysconfig.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.platform.configuration.sysconfig.domain.model.CodeList;
import ma.nafura.platform.configuration.sysconfig.api.request.CodeListCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.CodeListUpdateDto;
import ma.nafura.platform.configuration.sysconfig.mapper.CodeListMapper;
import ma.nafura.platform.configuration.sysconfig.repository.CodeListRepository;

/**
 * Base service for CodeList entity.
 * Auto-generated from code-list.entity.json — do not edit.
 */
public class CodeListServiceBase extends JpaCrudService<UUID, CodeList, CodeListCreateDto, CodeListUpdateDto> {
    protected CodeListServiceBase(CodeListRepository repository, CodeListMapper mapper) {
        super(repository, mapper);
    }
}


