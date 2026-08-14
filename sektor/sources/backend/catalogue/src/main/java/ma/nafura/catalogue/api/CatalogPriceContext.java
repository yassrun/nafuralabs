package ma.nafura.catalogue.api;

import java.time.LocalDate;
import java.util.UUID;

public record CatalogPriceContext(
        LocalDate referenceDate,
        UUID preferredSupplierId,
        UUID chantierId,
        UUID pivotCurrencyId,
        String pricingBase) {}
