package ma.nafura.achats.api.controller.base;

import java.util.UUID;
import ma.nafura.achats.api.request.PartnerContactCreateDto;
import ma.nafura.achats.api.request.PartnerContactUpdateDto;
import ma.nafura.achats.domain.fournisseur.PartnerContact;
import ma.nafura.achats.service.PartnerContactService;
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
