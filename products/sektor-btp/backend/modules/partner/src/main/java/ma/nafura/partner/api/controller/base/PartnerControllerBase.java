package ma.nafura.partner.api.controller.base;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerCreateDto;
import ma.nafura.partner.api.request.PartnerUpdateDto;
import ma.nafura.partner.domain.model.Partner;
import ma.nafura.partner.service.PartnerService;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;

public abstract class PartnerControllerBase
        extends CrudController<UUID, Partner, PartnerCreateDto, PartnerUpdateDto> {

    protected final PartnerService service;

    protected PartnerControllerBase(PartnerService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, Partner, PartnerCreateDto, PartnerUpdateDto> getService() {
        return service;
    }
}
