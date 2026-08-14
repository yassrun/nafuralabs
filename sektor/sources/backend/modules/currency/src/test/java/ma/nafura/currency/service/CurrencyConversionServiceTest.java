package ma.nafura.currency.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.currency.domain.model.Currency;
import ma.nafura.currency.domain.model.ExchangeRate;
import ma.nafura.currency.repository.CurrencyRepository;
import ma.nafura.currency.repository.ExchangeRateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CurrencyConversionServiceTest {

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    @Mock
    private CurrencyRepository currencyRepository;

    private CurrencyConversionService service;
    private UUID tenantId;
    private UUID eur;
    private UUID mad;
    private LocalDate date;

    @BeforeEach
    void setUp() {
        service = new CurrencyConversionService(exchangeRateRepository, currencyRepository);
        tenantId = UUID.randomUUID();
        eur = UUID.randomUUID();
        mad = UUID.randomUUID();
        date = LocalDate.of(2026, 6, 12);
    }

    @Test
    void convertUsesRateAtReferenceDate() {
        when(exchangeRateRepository.findRatesAtOrBefore(tenantId, eur, mad, date))
                .thenReturn(List.of(ExchangeRate.builder()
                        .rate(new BigDecimal("11.00"))
                        .effectiveDate(date.minusDays(2))
                        .build()));
        BigDecimal result = service.convert(tenantId, eur, mad, new BigDecimal("10"), date);
        assertEquals(0, new BigDecimal("110.00000000").compareTo(result));
    }

    @Test
    void sameCurrencyReturnsAmount() {
        BigDecimal amount = new BigDecimal("42.5");
        assertEquals(amount, service.convert(tenantId, mad, mad, amount, date));
        verifyNoInteractions(exchangeRateRepository);
    }

    @Test
    void findReferenceCurrency() {
        Currency ref = Currency.builder().id(mad).code("MAD").isReference(true).build();
        when(currencyRepository.findFirstByTenantIdAndIsReferenceTrue(tenantId)).thenReturn(Optional.of(ref));
        assertEquals(mad, service.findReferenceCurrency(tenantId).orElseThrow().getId());
    }
}
