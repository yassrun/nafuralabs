package ma.nafura.finance.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.finance.domain.model.ExchangeRate;
import ma.nafura.finance.api.request.ExchangeRateCreateDto;
import ma.nafura.finance.api.request.ExchangeRateUpdateDto;
import ma.nafura.finance.mapper.ExchangeRateMapper;
import ma.nafura.finance.repository.ExchangeRateRepository;

/**
 * Base service for ExchangeRate entity.
 * Auto-generated from exchange-rate.entity.json — do not edit.
 */
public class ExchangeRateServiceBase extends JpaCrudService<UUID, ExchangeRate, ExchangeRateCreateDto, ExchangeRateUpdateDto> {
    protected ExchangeRateServiceBase(ExchangeRateRepository repository, ExchangeRateMapper mapper) {
        super(repository, mapper);
    }
}
