package ma.nafura.platform.configuration.sysconfig.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.platform.configuration.sysconfig.domain.model.ReferenceValue;
import ma.nafura.platform.configuration.sysconfig.api.request.ReferenceValueCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.ReferenceValueUpdateDto;
import ma.nafura.platform.configuration.sysconfig.service.ReferenceValueService;

/**
 * Base REST controller for ReferenceValue entity.
 * Auto-generated from reference-value.entity.json — do not edit.
 */
public abstract class ReferenceValueControllerBase extends CrudController<UUID, ReferenceValue, ReferenceValueCreateDto, ReferenceValueUpdateDto> {

    protected final ReferenceValueService service;

    protected ReferenceValueControllerBase(ReferenceValueService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, ReferenceValue, ReferenceValueCreateDto, ReferenceValueUpdateDto> getService() {
        return service;
    }
}


