package ma.nafura.catalogue.adapters;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.service.port.TenantPrixHistoriquePort;
import ma.nafura.catalogue.domain.model.ItemPrice;
import ma.nafura.catalogue.repository.ItemPriceRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/** L16b — moyenne prix tenant (item_prices) sur 6 mois. */
@Component
@Primary
public class ItemPriceTenantHistoriqueAdapter implements TenantPrixHistoriquePort {

    private final ItemPriceRepository itemPriceRepository;

    public ItemPriceTenantHistoriqueAdapter(ItemPriceRepository itemPriceRepository) {
        this.itemPriceRepository = itemPriceRepository;
    }

    @Override
    public Optional<BigDecimal> moyenne6Mois(UUID itemId) {
        if (itemId == null) {
            return Optional.empty();
        }
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return Optional.empty();
        }
        LocalDate from = LocalDate.now().minusMonths(6);
        List<ItemPrice> rows = itemPriceRepository.findSince(tenantId, itemId, from);
        if (rows == null || rows.isEmpty()) {
            return Optional.empty();
        }
        BigDecimal sum = BigDecimal.ZERO;
        int n = 0;
        for (ItemPrice p : rows) {
            if (p.getUnitPrice() != null && p.getUnitPrice().signum() > 0) {
                sum = sum.add(p.getUnitPrice());
                n++;
            }
        }
        if (n == 0) {
            return Optional.empty();
        }
        return Optional.of(sum.divide(BigDecimal.valueOf(n), 4, RoundingMode.HALF_UP));
    }
}
