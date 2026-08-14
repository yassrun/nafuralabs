package ma.nafura.catalogue.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.catalogue.domain.stock.InventoryTxLine;
import ma.nafura.catalogue.api.request.InventoryTxLineCreateDto;
import ma.nafura.catalogue.api.request.InventoryTxLineUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for InventoryTxLine entity.
 * Auto-generated from inventory-tx-line.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface InventoryTxLineMapper extends EntityMapper<InventoryTxLine, InventoryTxLineCreateDto, InventoryTxLineUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    InventoryTxLine toEntity(InventoryTxLineCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(InventoryTxLineUpdateDto updateDto, @MappingTarget InventoryTxLine entity);

    @Override
    default void setTenantId(@MappingTarget InventoryTxLine entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(InventoryTxLine entity) {
        return entity.getId();
    }
}
