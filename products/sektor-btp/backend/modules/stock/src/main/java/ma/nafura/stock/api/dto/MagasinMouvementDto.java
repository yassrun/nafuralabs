package ma.nafura.stock.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record MagasinMouvementDto(
        UUID id,
        String txNumber,
        String txType,
        LocalDate txDate,
        String status,
        BigDecimal totalQuantity) {}
