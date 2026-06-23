package ma.nafura.currency.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.currency.domain.model.PaymentTerm;
import ma.nafura.currency.api.request.PaymentTermCreateDto;
import ma.nafura.currency.api.request.PaymentTermUpdateDto;
import ma.nafura.currency.service.PaymentTermService;

/**
 * Base REST controller for PaymentTerm entity.
 * Auto-generated from payment-term.entity.json — do not edit.
 */
public abstract class PaymentTermControllerBase extends CrudController<UUID, PaymentTerm, PaymentTermCreateDto, PaymentTermUpdateDto> {

    protected final PaymentTermService service;

    protected PaymentTermControllerBase(PaymentTermService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, PaymentTerm, PaymentTermCreateDto, PaymentTermUpdateDto> getService() {
        return service;
    }
}
