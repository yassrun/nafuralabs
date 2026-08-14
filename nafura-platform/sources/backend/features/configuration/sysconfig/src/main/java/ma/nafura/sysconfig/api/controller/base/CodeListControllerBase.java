package ma.nafura.platform.configuration.sysconfig.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.platform.configuration.sysconfig.domain.model.CodeList;
import ma.nafura.platform.configuration.sysconfig.api.request.CodeListCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.CodeListUpdateDto;
import ma.nafura.platform.configuration.sysconfig.service.CodeListService;

/**
 * Base REST controller for CodeList entity.
 * Auto-generated from code-list.entity.json — do not edit.
 */
public abstract class CodeListControllerBase extends CrudController<UUID, CodeList, CodeListCreateDto, CodeListUpdateDto> {

    protected final CodeListService service;

    protected CodeListControllerBase(CodeListService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, CodeList, CodeListCreateDto, CodeListUpdateDto> getService() {
        return service;
    }
}


