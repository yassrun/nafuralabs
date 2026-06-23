package ma.nafura.partner.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.partner.api.request.PartnerContactCreateDto;
import ma.nafura.partner.domain.model.PartnerContact;
import ma.nafura.partner.mapper.PartnerContactMapper;
import ma.nafura.partner.repository.PartnerContactRepository;
import ma.nafura.partner.repository.PartnerRepository;
import ma.nafura.partner.service.base.PartnerContactServiceBase;
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
