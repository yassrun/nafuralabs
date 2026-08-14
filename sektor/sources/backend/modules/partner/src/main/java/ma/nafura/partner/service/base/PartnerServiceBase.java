package ma.nafura.partner.service.base;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerCreateDto;
import ma.nafura.partner.api.request.PartnerUpdateDto;
import ma.nafura.partner.domain.model.Partner;
import ma.nafura.partner.mapper.PartnerMapper;
import ma.nafura.partner.repository.PartnerRepository;
import ma.nafura.platform.framework.service.crud.JpaCrudService;

public class PartnerServiceBase extends JpaCrudService<UUID, Partner, PartnerCreateDto, PartnerUpdateDto> {

    protected final PartnerRepository partnerRepository;

    protected PartnerServiceBase(PartnerRepository repository, PartnerMapper mapper) {
        super(repository, mapper);
        this.partnerRepository = repository;
    }
}
