package ma.nafura.achats.service.base;

import java.util.UUID;
import ma.nafura.achats.api.request.PartnerAddressCreateDto;
import ma.nafura.achats.api.request.PartnerAddressUpdateDto;
import ma.nafura.achats.domain.fournisseur.PartnerAddress;
import ma.nafura.achats.mapper.PartnerAddressMapper;
import ma.nafura.achats.repository.PartnerAddressRepository;
import ma.nafura.platform.framework.service.crud.JpaCrudService;

public class PartnerAddressServiceBase
        extends JpaCrudService<UUID, PartnerAddress, PartnerAddressCreateDto, PartnerAddressUpdateDto> {

    protected final PartnerAddressRepository addressRepository;

    protected PartnerAddressServiceBase(PartnerAddressRepository repository, PartnerAddressMapper mapper) {
        super(repository, mapper);
        this.addressRepository = repository;
    }
}
