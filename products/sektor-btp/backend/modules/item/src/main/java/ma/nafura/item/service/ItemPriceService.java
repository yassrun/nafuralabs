package ma.nafura.item.service;

import ma.nafura.currency.domain.model.Currency;
import ma.nafura.currency.service.CurrencyConversionService;
import ma.nafura.item.api.request.ItemPriceCreateDto;
import ma.nafura.item.domain.model.ItemPrice;
import ma.nafura.item.mapper.ItemPriceMapper;
import ma.nafura.item.repository.ItemPriceRepository;
import ma.nafura.item.service.base.ItemPriceServiceBase;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Custom service for ItemPrice entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class ItemPriceService extends ItemPriceServiceBase {

    private final CurrencyConversionService currencyConversionService;

    public ItemPriceService(
            ItemPriceRepository repository,
            ItemPriceMapper mapper,
            CurrencyConversionService currencyConversionService) {
        super(repository, mapper);
        this.currencyConversionService = currencyConversionService;
    }

    @Override
    @Transactional
    public ItemPrice create(ItemPriceCreateDto request) {
        if (request.getCurrencyId() == null) {
            var currencyId = currencyConversionService
                    .findReferenceCurrency(tenantId())
                    .map(Currency::getId)
                    .orElseThrow(() -> new IllegalArgumentException("currency.reference_missing"));
            request.setCurrencyId(currencyId);
        }
        return super.create(request);
    }
}
