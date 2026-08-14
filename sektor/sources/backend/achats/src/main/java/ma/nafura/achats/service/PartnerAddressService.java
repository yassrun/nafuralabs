package ma.nafura.achats.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.request.PartnerAddressCreateDto;
import ma.nafura.achats.domain.fournisseur.PartnerAddress;
import ma.nafura.achats.mapper.PartnerAddressMapper;
import ma.nafura.achats.repository.PartnerAddressRepository;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.achats.service.base.PartnerAddressServiceBase;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartnerAddressService extends PartnerAddressServiceBase {

    private final PartnerRepository partnerRepository;

    public PartnerAddressService(
            PartnerAddressRepository repository,
            PartnerAddressMapper mapper,
            PartnerRepository partnerRepository) {
        super(repository, mapper);
        this.partnerRepository = partnerRepository;
    }

    @Override
    @Transactional
    public PartnerAddress create(PartnerAddressCreateDto request) {
        partnerRepository
                .findByIdAndTenantId(request.getPartnerId(), tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Partner not found"));
        return super.create(request);
    }

    @Transactional(readOnly = true)
    public List<PartnerAddress> listForPartner(UUID partnerId) {
        return addressRepository.findByTenantIdAndPartnerIdOrderByTypeAsc(tenantId(), partnerId);
    }
}
