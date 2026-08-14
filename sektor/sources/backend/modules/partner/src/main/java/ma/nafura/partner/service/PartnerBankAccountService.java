package ma.nafura.partner.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.partner.api.request.PartnerBankAccountCreateDto;
import ma.nafura.partner.domain.model.PartnerBankAccount;
import ma.nafura.partner.mapper.PartnerBankAccountMapper;
import ma.nafura.partner.repository.PartnerBankAccountRepository;
import ma.nafura.partner.repository.PartnerRepository;
import ma.nafura.partner.service.base.PartnerBankAccountServiceBase;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartnerBankAccountService extends PartnerBankAccountServiceBase {

    private final PartnerRepository partnerRepository;

    public PartnerBankAccountService(
            PartnerBankAccountRepository repository,
            PartnerBankAccountMapper mapper,
            PartnerRepository partnerRepository) {
        super(repository, mapper);
        this.partnerRepository = partnerRepository;
    }

    @Override
    @Transactional
    public PartnerBankAccount create(PartnerBankAccountCreateDto request) {
        partnerRepository
                .findByIdAndTenantId(request.getPartnerId(), tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Partner not found"));
        return super.create(request);
    }

    @Transactional(readOnly = true)
    public List<PartnerBankAccount> listForPartner(UUID partnerId) {
        return bankAccountRepository.findByTenantIdAndPartnerIdOrderByBanqueAsc(tenantId(), partnerId);
    }
}
