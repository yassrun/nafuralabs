package ma.nafura.achats.service.base;

import java.util.UUID;
import ma.nafura.achats.api.request.PartnerBankAccountCreateDto;
import ma.nafura.achats.api.request.PartnerBankAccountUpdateDto;
import ma.nafura.achats.domain.model.PartnerBankAccount;
import ma.nafura.achats.mapper.PartnerBankAccountMapper;
import ma.nafura.achats.repository.PartnerBankAccountRepository;
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
