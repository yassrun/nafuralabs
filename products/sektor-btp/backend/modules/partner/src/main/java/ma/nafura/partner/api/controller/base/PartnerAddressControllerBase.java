package ma.nafura.partner.api.controller.base;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerAddressCreateDto;
import ma.nafura.partner.api.request.PartnerAddressUpdateDto;
import ma.nafura.partner.domain.model.PartnerAddress;
import ma.nafura.partner.service.PartnerAddressService;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;

public abstract class PartnerAddressControllerBase
        extends CrudController<UUID, PartnerAddress, PartnerAddressCreateDto, PartnerAddressUpdateDto> {

    protected final PartnerAddressService service;

    protected PartnerAddressControllerBase(PartnerAddressService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, PartnerAddress, PartnerAddressCreateDto, PartnerAddressUpdateDto> getService() {
        return service;
    }
}
