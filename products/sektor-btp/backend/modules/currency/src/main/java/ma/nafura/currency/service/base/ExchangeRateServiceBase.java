package ma.nafura.currency.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.currency.domain.model.ExchangeRate;
import ma.nafura.currency.api.request.ExchangeRateCreateDto;
import ma.nafura.currency.api.request.ExchangeRateUpdateDto;
import ma.nafura.currency.mapper.ExchangeRateMapper;
import ma.nafura.currency.repository.ExchangeRateRepository;

/**
 * Base service for ExchangeRate entity.
 * Auto-generated from exchange-rate.entity.json — do not edit.
 */
public class ExchangeRateServiceBase extends JpaCrudService<UUID, ExchangeRate, ExchangeRateCreateDto, ExchangeRateUpdateDto> {
    protected ExchangeRateServiceBase(ExchangeRateRepository repository, ExchangeRateMapper mapper) {
        super(repository, mapper);
    }
}
