package ma.nafura.finance.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.finance.domain.devise.Currency;
import ma.nafura.finance.api.request.CurrencyCreateDto;
import ma.nafura.finance.api.request.CurrencyUpdateDto;
import ma.nafura.finance.mapper.CurrencyMapper;
import ma.nafura.finance.repository.CurrencyRepository;

/**
 * Base service for Currency entity.
 * Auto-generated from currency.entity.json — do not edit.
 */
public class CurrencyServiceBase extends JpaCrudService<UUID, Currency, CurrencyCreateDto, CurrencyUpdateDto> {
    protected CurrencyServiceBase(CurrencyRepository repository, CurrencyMapper mapper) {
        super(repository, mapper);
    }
}
