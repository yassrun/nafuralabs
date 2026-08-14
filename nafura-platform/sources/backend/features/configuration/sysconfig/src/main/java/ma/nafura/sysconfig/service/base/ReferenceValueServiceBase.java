package ma.nafura.platform.configuration.sysconfig.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.platform.configuration.sysconfig.domain.model.ReferenceValue;
import ma.nafura.platform.configuration.sysconfig.api.request.ReferenceValueCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.ReferenceValueUpdateDto;
import ma.nafura.platform.configuration.sysconfig.mapper.ReferenceValueMapper;
import ma.nafura.platform.configuration.sysconfig.repository.ReferenceValueRepository;

/**
 * Base service for ReferenceValue entity.
 * Auto-generated from reference-value.entity.json — do not edit.
 */
public class ReferenceValueServiceBase extends JpaCrudService<UUID, ReferenceValue, ReferenceValueCreateDto, ReferenceValueUpdateDto> {
    protected ReferenceValueServiceBase(ReferenceValueRepository repository, ReferenceValueMapper mapper) {
        super(repository, mapper);
    }
}


