package ma.nafura.catalogue.service;

import ma.nafura.finance.domain.model.Currency;
import ma.nafura.finance.service.CurrencyConversionService;
import ma.nafura.catalogue.api.request.ItemPriceCreateDto;
import ma.nafura.catalogue.domain.model.ItemPrice;
import ma.nafura.catalogue.mapper.ItemPriceMapper;
import ma.nafura.catalogue.repository.ItemPriceRepository;
import ma.nafura.catalogue.service.base.ItemPriceServiceBase;
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
