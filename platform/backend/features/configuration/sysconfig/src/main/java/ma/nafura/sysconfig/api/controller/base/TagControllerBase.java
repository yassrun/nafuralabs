package ma.nafura.platform.configuration.sysconfig.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.platform.configuration.sysconfig.domain.model.Tag;
import ma.nafura.platform.configuration.sysconfig.api.request.TagCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.TagUpdateDto;
import ma.nafura.platform.configuration.sysconfig.service.TagService;

/**
 * Base REST controller for Tag entity.
 * Auto-generated from tag.entity.json — do not edit.
 */
public abstract class TagControllerBase extends CrudController<UUID, Tag, TagCreateDto, TagUpdateDto> {

    protected final TagService service;

    protected TagControllerBase(TagService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, Tag, TagCreateDto, TagUpdateDto> getService() {
        return service;
    }
}


