package ma.nafura.partner.api.controller.base;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerContactCreateDto;
import ma.nafura.partner.api.request.PartnerContactUpdateDto;
import ma.nafura.partner.domain.model.PartnerContact;
import ma.nafura.partner.service.PartnerContactService;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;

public abstract class PartnerContactControllerBase
        extends CrudController<UUID, PartnerContact, PartnerContactCreateDto, PartnerContactUpdateDto> {

    protected final PartnerContactService service;

    protected PartnerContactControllerBase(PartnerContactService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, PartnerContact, PartnerContactCreateDto, PartnerContactUpdateDto> getService() {
        return service;
    }
}
