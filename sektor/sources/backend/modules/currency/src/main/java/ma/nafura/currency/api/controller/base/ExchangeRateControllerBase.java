package ma.nafura.currency.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.currency.domain.model.ExchangeRate;
import ma.nafura.currency.api.request.ExchangeRateCreateDto;
import ma.nafura.currency.api.request.ExchangeRateUpdateDto;
import ma.nafura.currency.service.ExchangeRateService;

/**
 * Base REST controller for ExchangeRate entity.
 * Auto-generated from exchange-rate.entity.json — do not edit.
 */
public abstract class ExchangeRateControllerBase extends CrudController<UUID, ExchangeRate, ExchangeRateCreateDto, ExchangeRateUpdateDto> {

    protected final ExchangeRateService service;

    protected ExchangeRateControllerBase(ExchangeRateService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, ExchangeRate, ExchangeRateCreateDto, ExchangeRateUpdateDto> getService() {
        return service;
    }
}
