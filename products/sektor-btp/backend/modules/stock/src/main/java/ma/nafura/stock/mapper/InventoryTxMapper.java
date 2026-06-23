package ma.nafura.stock.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.stock.domain.model.InventoryTx;
import ma.nafura.stock.api.request.InventoryTxCreateDto;
import ma.nafura.stock.api.request.InventoryTxUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for InventoryTx entity.
 * Auto-generated from inventory-tx.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface InventoryTxMapper extends EntityMapper<InventoryTx, InventoryTxCreateDto, InventoryTxUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    InventoryTx toEntity(InventoryTxCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(InventoryTxUpdateDto updateDto, @MappingTarget InventoryTx entity);

    @Override
    default void setTenantId(@MappingTarget InventoryTx entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(InventoryTx entity) {
        return entity.getId();
    }
}
