package ma.nafura.currency.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.currency.domain.model.Currency;
import ma.nafura.currency.api.request.CurrencyCreateDto;
import ma.nafura.currency.api.request.CurrencyUpdateDto;
import ma.nafura.currency.service.CurrencyService;

/**
 * Base REST controller for Currency entity.
 * Auto-generated from currency.entity.json — do not edit.
 */
public abstract class CurrencyControllerBase extends CrudController<UUID, Currency, CurrencyCreateDto, CurrencyUpdateDto> {

    protected final CurrencyService service;

    protected CurrencyControllerBase(CurrencyService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, Currency, CurrencyCreateDto, CurrencyUpdateDto> getService() {
        return service;
    }
}
