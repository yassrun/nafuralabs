package ma.nafura.stock.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.stock.api.request.StockBalanceCreateDto;
import ma.nafura.stock.api.request.StockBalanceUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for StockBalance entity.
 * Auto-generated from stock-balance.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface StockBalanceMapper extends EntityMapper<StockBalance, StockBalanceCreateDto, StockBalanceUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    StockBalance toEntity(StockBalanceCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(StockBalanceUpdateDto updateDto, @MappingTarget StockBalance entity);

    @Override
    default void setTenantId(@MappingTarget StockBalance entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(StockBalance entity) {
        return entity.getId();
    }
}
