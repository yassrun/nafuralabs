package ma.nafura.achats.api.controller.base;

import java.util.UUID;
import ma.nafura.achats.api.request.PartnerCreateDto;
import ma.nafura.achats.api.request.PartnerUpdateDto;
import ma.nafura.achats.domain.model.Partner;
import ma.nafura.achats.service.PartnerService;
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
