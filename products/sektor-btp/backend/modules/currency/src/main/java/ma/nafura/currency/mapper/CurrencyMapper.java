package ma.nafura.currency.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.currency.domain.model.Currency;
import ma.nafura.currency.api.request.CurrencyCreateDto;
import ma.nafura.currency.api.request.CurrencyUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for Currency entity.
 * Auto-generated from currency.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface CurrencyMapper extends EntityMapper<Currency, CurrencyCreateDto, CurrencyUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Currency toEntity(CurrencyCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CurrencyUpdateDto updateDto, @MappingTarget Currency entity);

    @Override
    default void setTenantId(@MappingTarget Currency entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(Currency entity) {
        return entity.getId();
    }
}
