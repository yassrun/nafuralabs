package ma.nafura.stock.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MagasinStockArticleDto(
        UUID itemId,
        String code,
        String label,
        BigDecimal qte,
        BigDecimal unitPrice,
        BigDecimal valorisation) {}
