package ma.nafura.currency.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.currency.domain.model.ExchangeRate;
import ma.nafura.currency.api.request.ExchangeRateCreateDto;
import ma.nafura.currency.api.request.ExchangeRateUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for ExchangeRate entity.
 * Auto-generated from exchange-rate.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface ExchangeRateMapper extends EntityMapper<ExchangeRate, ExchangeRateCreateDto, ExchangeRateUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ExchangeRate toEntity(ExchangeRateCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(ExchangeRateUpdateDto updateDto, @MappingTarget ExchangeRate entity);

    @Override
    default void setTenantId(@MappingTarget ExchangeRate entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(ExchangeRate entity) {
        return entity.getId();
    }
}
