package ma.nafura.currency.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.currency.api.request.ExchangeRateCreateDto;
import ma.nafura.currency.domain.model.Currency;
import ma.nafura.currency.domain.model.ExchangeRate;
import ma.nafura.currency.mapper.ExchangeRateMapper;
import ma.nafura.currency.repository.CurrencyRepository;
import ma.nafura.currency.repository.ExchangeRateRepository;
import ma.nafura.currency.service.base.ExchangeRateServiceBase;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Custom service for ExchangeRate entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class ExchangeRateService extends ExchangeRateServiceBase {

    private final CurrencyRepository currencyRepository;
    private final BamExchangeRateProvider bamExchangeRateProvider;

    public ExchangeRateService(
            ExchangeRateRepository repository,
            ExchangeRateMapper mapper,
            CurrencyRepository currencyRepository,
            BamExchangeRateProvider bamExchangeRateProvider) {
        super(repository, mapper);
        this.currencyRepository = currencyRepository;
        this.bamExchangeRateProvider = bamExchangeRateProvider;
    }

    /**
     * Imports today's BAM quotations for supported foreign currencies against MAD.
     */
    @Transactional
    public List<ExchangeRate> importFromBam() {
        UUID tenantId = TenantContext.getTenantId();
        Currency mad = currencyRepository
                .findByTenantIdAndCode(tenantId, "MAD")
                .orElseThrow(() -> new IllegalStateException("Reference currency MAD is not configured"));

        Map<String, BigDecimal> quotes = bamExchangeRateProvider.fetchRatesAgainstMad();
        LocalDate today = LocalDate.now();
        List<ExchangeRate> created = new ArrayList<>();

        for (Map.Entry<String, BigDecimal> quote : quotes.entrySet()) {
            Currency foreign = currencyRepository
                    .findByTenantIdAndCode(tenantId, quote.getKey())
                    .orElse(null);
            if (foreign == null) {
                continue;
            }

            ExchangeRateCreateDto dto = new ExchangeRateCreateDto();
            dto.setFromCurrencyId(foreign.getId());
            dto.setToCurrencyId(mad.getId());
            dto.setRate(quote.getValue());
            dto.setEffectiveDate(today);
            dto.setSource("BAM");
            created.add(create(dto));
        }

        if (created.isEmpty()) {
            throw new IllegalStateException(
                    "No BAM rates imported — configure foreign currencies (EUR, USD, …) for this tenant");
        }
        return created;
    }
}
