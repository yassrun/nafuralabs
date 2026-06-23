package ma.nafura.item.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.item.domain.model.ItemType;
import ma.nafura.item.api.request.ItemTypeCreateDto;
import ma.nafura.item.api.request.ItemTypeUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for ItemType entity.
 * Auto-generated from item-type.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface ItemTypeMapper extends EntityMapper<ItemType, ItemTypeCreateDto, ItemTypeUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ItemType toEntity(ItemTypeCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(ItemTypeUpdateDto updateDto, @MappingTarget ItemType entity);

    @Override
    default void setTenantId(@MappingTarget ItemType entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(ItemType entity) {
        return entity.getId();
    }
}
