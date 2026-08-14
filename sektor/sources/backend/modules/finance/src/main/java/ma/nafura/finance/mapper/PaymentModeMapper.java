package ma.nafura.finance.mapper;

import java.util.UUID;
import ma.nafura.finance.api.request.PaymentModeCreateDto;
import ma.nafura.finance.api.request.PaymentModeUpdateDto;
import ma.nafura.finance.domain.model.PaymentMode;
import ma.nafura.platform.framework.mapper.EntityMapper;
import org.springframework.stereotype.Component;

@Component
public class PaymentModeMapper implements EntityMapper<PaymentMode, PaymentModeCreateDto, PaymentModeUpdateDto> {

    @Override
    public PaymentMode toEntity(PaymentModeCreateDto createDto) {
        return PaymentMode.builder()
                .code(createDto.getCode().trim())
                .name(createDto.getName().trim())
                .isActive(createDto.getIsActive() != null ? createDto.getIsActive() : true)
                .build();
    }

    @Override
    public void updateEntity(PaymentModeUpdateDto updateDto, PaymentMode entity) {
        if (updateDto.getCode() != null) {
            entity.setCode(updateDto.getCode().trim());
        }
        if (updateDto.getName() != null) {
            entity.setName(updateDto.getName().trim());
        }
        if (updateDto.getIsActive() != null) {
            entity.setIsActive(updateDto.getIsActive());
        }
    }

    @Override
    public void setTenantId(PaymentMode entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    public Object getId(PaymentMode entity) {
        return entity.getId();
    }
}
