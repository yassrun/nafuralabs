package ma.nafura.achats.service.base;

import java.util.UUID;
import ma.nafura.achats.api.request.PartnerContactCreateDto;
import ma.nafura.achats.api.request.PartnerContactUpdateDto;
import ma.nafura.achats.domain.model.PartnerContact;
import ma.nafura.achats.mapper.PartnerContactMapper;
import ma.nafura.achats.repository.PartnerContactRepository;
import ma.nafura.platform.framework.service.crud.JpaCrudService;

public class PartnerContactServiceBase
        extends JpaCrudService<UUID, PartnerContact, PartnerContactCreateDto, PartnerContactUpdateDto> {

    protected final PartnerContactRepository contactRepository;

    protected PartnerContactServiceBase(PartnerContactRepository repository, PartnerContactMapper mapper) {
        super(repository, mapper);
        this.contactRepository = repository;
    }
}
