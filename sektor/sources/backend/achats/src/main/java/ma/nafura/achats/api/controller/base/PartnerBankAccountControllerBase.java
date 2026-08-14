package ma.nafura.achats.api.controller.base;

import java.util.UUID;
import ma.nafura.achats.api.request.PartnerBankAccountCreateDto;
import ma.nafura.achats.api.request.PartnerBankAccountUpdateDto;
import ma.nafura.achats.domain.fournisseur.PartnerBankAccount;
import ma.nafura.achats.service.PartnerBankAccountService;
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
