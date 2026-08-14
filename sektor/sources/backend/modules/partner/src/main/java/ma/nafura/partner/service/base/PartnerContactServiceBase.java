package ma.nafura.partner.service.base;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerContactCreateDto;
import ma.nafura.partner.api.request.PartnerContactUpdateDto;
import ma.nafura.partner.domain.model.PartnerContact;
import ma.nafura.partner.mapper.PartnerContactMapper;
import ma.nafura.partner.repository.PartnerContactRepository;
import ma.nafura.platform.framework.service.crud.JpaCrudService;

public class PartnerContactServiceBase
        extends JpaCrudService<UUID, PartnerContact, PartnerContactCreateDto, PartnerContactUpdateDto> {

    protected final PartnerContactRepository contactRepository;

    protected PartnerContactServiceBase(PartnerContactRepository repository, PartnerContactMapper mapper) {
        super(repository, mapper);
        this.contactRepository = repository;
    }
}
