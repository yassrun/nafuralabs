package ma.nafura.platform.configuration.sysconfig.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.platform.configuration.sysconfig.domain.model.NumberingSequence;
import ma.nafura.platform.configuration.sysconfig.api.request.NumberingSequenceCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.NumberingSequenceUpdateDto;
import ma.nafura.platform.configuration.sysconfig.mapper.NumberingSequenceMapper;
import ma.nafura.platform.configuration.sysconfig.repository.NumberingSequenceRepository;

/**
 * Base service for NumberingSequence entity.
 * Auto-generated from numbering-sequence.entity.json — do not edit.
 */
public class NumberingSequenceServiceBase extends JpaCrudService<UUID, NumberingSequence, NumberingSequenceCreateDto, NumberingSequenceUpdateDto> {
    protected NumberingSequenceServiceBase(NumberingSequenceRepository repository, NumberingSequenceMapper mapper) {
        super(repository, mapper);
    }
}


