package ma.nafura.platform.configuration.sysconfig.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.platform.configuration.sysconfig.domain.model.NumberingSequence;
import ma.nafura.platform.configuration.sysconfig.api.request.NumberingSequenceCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.NumberingSequenceUpdateDto;
import ma.nafura.platform.configuration.sysconfig.service.NumberingSequenceService;

/**
 * Base REST controller for NumberingSequence entity.
 * Auto-generated from numbering-sequence.entity.json — do not edit.
 */
public abstract class NumberingSequenceControllerBase extends CrudController<UUID, NumberingSequence, NumberingSequenceCreateDto, NumberingSequenceUpdateDto> {

    protected final NumberingSequenceService service;

    protected NumberingSequenceControllerBase(NumberingSequenceService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, NumberingSequence, NumberingSequenceCreateDto, NumberingSequenceUpdateDto> getService() {
        return service;
    }
}


