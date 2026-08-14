package ma.nafura.catalogue.api;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CatalogPriceSnapshot(
        BigDecimal unitPrice,
        String priceSource,
        UUID sourceRefId,
        LocalDate sourceDate,
        UUID currencyId,
        String sourceLabel,
        boolean expired) {}
