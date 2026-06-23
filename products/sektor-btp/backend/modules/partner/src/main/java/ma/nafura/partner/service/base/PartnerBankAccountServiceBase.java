package ma.nafura.partner.service.base;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerBankAccountCreateDto;
import ma.nafura.partner.api.request.PartnerBankAccountUpdateDto;
import ma.nafura.partner.domain.model.PartnerBankAccount;
import ma.nafura.partner.mapper.PartnerBankAccountMapper;
import ma.nafura.partner.repository.PartnerBankAccountRepository;
import ma.nafura.platform.framework.service.crud.JpaCrudService;

public class PartnerBankAccountServiceBase
        extends JpaCrudService<UUID, PartnerBankAccount, PartnerBankAccountCreateDto, PartnerBankAccountUpdateDto> {

    protected final PartnerBankAccountRepository bankAccountRepository;

    protected PartnerBankAccountServiceBase(
            PartnerBankAccountRepository repository, PartnerBankAccountMapper mapper) {
        super(repository, mapper);
        this.bankAccountRepository = repository;
    }
}
