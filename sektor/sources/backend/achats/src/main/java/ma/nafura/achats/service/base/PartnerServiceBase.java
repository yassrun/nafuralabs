package ma.nafura.achats.service.base;

import java.util.UUID;
import ma.nafura.achats.api.request.PartnerCreateDto;
import ma.nafura.achats.api.request.PartnerUpdateDto;
import ma.nafura.achats.domain.fournisseur.Partner;
import ma.nafura.achats.mapper.PartnerMapper;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.platform.framework.service.crud.JpaCrudService;

public class PartnerServiceBase extends JpaCrudService<UUID, Partner, PartnerCreateDto, PartnerUpdateDto> {

    protected final PartnerRepository partnerRepository;

    protected PartnerServiceBase(PartnerRepository repository, PartnerMapper mapper) {
        super(repository, mapper);
        this.partnerRepository = repository;
    }
}
