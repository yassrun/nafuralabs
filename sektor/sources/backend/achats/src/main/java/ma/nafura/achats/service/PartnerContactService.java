package ma.nafura.achats.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.request.PartnerContactCreateDto;
import ma.nafura.achats.domain.model.PartnerContact;
import ma.nafura.achats.mapper.PartnerContactMapper;
import ma.nafura.achats.repository.PartnerContactRepository;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.achats.service.base.PartnerContactServiceBase;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartnerContactService extends PartnerContactServiceBase {

    private final PartnerRepository partnerRepository;

    public PartnerContactService(
            PartnerContactRepository repository,
            PartnerContactMapper mapper,
            PartnerRepository partnerRepository) {
        super(repository, mapper);
        this.partnerRepository = partnerRepository;
    }

    @Override
    @Transactional
    public PartnerContact create(PartnerContactCreateDto request) {
        partnerRepository
                .findByIdAndTenantId(request.getPartnerId(), tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Partner not found"));
        return super.create(request);
    }

    @Transactional(readOnly = true)
    public List<PartnerContact> listForPartner(UUID partnerId) {
        return contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(tenantId(), partnerId);
    }
}
