package ma.nafura.finance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.Currency;
import ma.nafura.finance.domain.model.ExchangeRate;
import ma.nafura.finance.repository.CurrencyRepository;
import ma.nafura.finance.repository.ExchangeRateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Conversion de montants au taux de la date de référence (pas du jour).
 */
@Service
public class CurrencyConversionService {

    private final ExchangeRateRepository exchangeRateRepository;
    private final CurrencyRepository currencyRepository;

    public CurrencyConversionService(
            ExchangeRateRepository exchangeRateRepository, CurrencyRepository currencyRepository) {
        this.exchangeRateRepository = exchangeRateRepository;
        this.currencyRepository = currencyRepository;
    }

    @Transactional(readOnly = true)
    public Optional<Currency> findReferenceCurrency(UUID tenantId) {
        return currencyRepository.findFirstByTenantIdAndIsReferenceTrue(tenantId);
    }

    @Transactional(readOnly = true)
    public BigDecimal convert(
            UUID tenantId, UUID fromCurrencyId, UUID toCurrencyId, BigDecimal amount, LocalDate dateReference) {
        if (amount == null) {
            return null;
        }
        if (fromCurrencyId == null || toCurrencyId == null || fromCurrencyId.equals(toCurrencyId)) {
            return amount;
        }
        LocalDate date = dateReference != null ? dateReference : LocalDate.now();
        Optional<BigDecimal> direct = findRate(tenantId, fromCurrencyId, toCurrencyId, date);
        if (direct.isPresent()) {
            return amount.multiply(direct.get()).setScale(8, RoundingMode.HALF_UP);
        }
        Optional<BigDecimal> inverse = findRate(tenantId, toCurrencyId, fromCurrencyId, date);
        if (inverse.isPresent() && inverse.get().compareTo(BigDecimal.ZERO) != 0) {
            return amount.divide(inverse.get(), 8, RoundingMode.HALF_UP);
        }
        Optional<Currency> pivot = findReferenceCurrency(tenantId);
        if (pivot.isPresent()) {
            UUID pivotId = pivot.get().getId();
            if (!fromCurrencyId.equals(pivotId) && !toCurrencyId.equals(pivotId)) {
                BigDecimal toPivot = convert(tenantId, fromCurrencyId, pivotId, amount, date);
                return convert(tenantId, pivotId, toCurrencyId, toPivot, date);
            }
        }
        throw new IllegalStateException(
                "currency.conversion.rate_missing for " + fromCurrencyId + " → " + toCurrencyId + " @ " + date);
    }

    private Optional<BigDecimal> findRate(UUID tenantId, UUID from, UUID to, LocalDate date) {
        List<ExchangeRate> rates =
                exchangeRateRepository.findRatesAtOrBefore(tenantId, from, to, date);
        return rates.stream()
                .max(Comparator.comparing(ExchangeRate::getEffectiveDate))
                .map(ExchangeRate::getRate);
    }
}
