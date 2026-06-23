package ma.nafura.currency.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.currency.domain.model.PaymentTerm;
import ma.nafura.currency.api.request.PaymentTermCreateDto;
import ma.nafura.currency.api.request.PaymentTermUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for PaymentTerm entity.
 * Auto-generated from payment-term.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface PaymentTermMapper extends EntityMapper<PaymentTerm, PaymentTermCreateDto, PaymentTermUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    PaymentTerm toEntity(PaymentTermCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(PaymentTermUpdateDto updateDto, @MappingTarget PaymentTerm entity);

    @Override
    default void setTenantId(@MappingTarget PaymentTerm entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(PaymentTerm entity) {
        return entity.getId();
    }
}
