package ma.nafura.achats.api.controller.base;

import java.util.UUID;
import ma.nafura.achats.api.request.PartnerAddressCreateDto;
import ma.nafura.achats.api.request.PartnerAddressUpdateDto;
import ma.nafura.achats.domain.fournisseur.PartnerAddress;
import ma.nafura.achats.service.PartnerAddressService;
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
