package ma.nafura.partner.service.base;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerAddressCreateDto;
import ma.nafura.partner.api.request.PartnerAddressUpdateDto;
import ma.nafura.partner.domain.model.PartnerAddress;
import ma.nafura.partner.mapper.PartnerAddressMapper;
import ma.nafura.partner.repository.PartnerAddressRepository;
import ma.nafura.platform.framework.service.crud.JpaCrudService;

public class PartnerAddressServiceBase
        extends JpaCrudService<UUID, PartnerAddress, PartnerAddressCreateDto, PartnerAddressUpdateDto> {

    protected final PartnerAddressRepository addressRepository;

    protected PartnerAddressServiceBase(PartnerAddressRepository repository, PartnerAddressMapper mapper) {
        super(repository, mapper);
        this.addressRepository = repository;
    }
}
