package ma.nafura.partner.api.controller.base;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerBankAccountCreateDto;
import ma.nafura.partner.api.request.PartnerBankAccountUpdateDto;
import ma.nafura.partner.domain.model.PartnerBankAccount;
import ma.nafura.partner.service.PartnerBankAccountService;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;

public abstract class PartnerBankAccountControllerBase
        extends CrudController<UUID, PartnerBankAccount, PartnerBankAccountCreateDto, PartnerBankAccountUpdateDto> {

    protected final PartnerBankAccountService service;

    protected PartnerBankAccountControllerBase(PartnerBankAccountService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, PartnerBankAccount, PartnerBankAccountCreateDto, PartnerBankAccountUpdateDto>
            getService() {
        return service;
    }
}
