package ma.nafura.currency.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ma.nafura.currency.api.request.PaymentTermInstallmentInputDto;

public record PaymentTermDetailDto(
        UUID id,
        String code,
        String name,
        Integer days,
        Integer discountDays,
        BigDecimal discountPercent,
        String description,
        String termType,
        Boolean isDefault,
        String notes,
        Boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<PaymentTermInstallmentInputDto> installments) {}
