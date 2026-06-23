package ma.nafura.currency.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.currency.domain.model.Currency;
import ma.nafura.currency.api.request.CurrencyCreateDto;
import ma.nafura.currency.api.request.CurrencyUpdateDto;
import ma.nafura.currency.mapper.CurrencyMapper;
import ma.nafura.currency.repository.CurrencyRepository;

/**
 * Base service for Currency entity.
 * Auto-generated from currency.entity.json — do not edit.
 */
public class CurrencyServiceBase extends JpaCrudService<UUID, Currency, CurrencyCreateDto, CurrencyUpdateDto> {
    protected CurrencyServiceBase(CurrencyRepository repository, CurrencyMapper mapper) {
        super(repository, mapper);
    }
}
