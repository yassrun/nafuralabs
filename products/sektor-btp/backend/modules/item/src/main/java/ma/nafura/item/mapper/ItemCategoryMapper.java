package ma.nafura.item.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.item.domain.model.ItemCategory;
import ma.nafura.item.api.request.ItemCategoryCreateDto;
import ma.nafura.item.api.request.ItemCategoryUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for ItemCategory entity.
 * Auto-generated from item-category.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface ItemCategoryMapper extends EntityMapper<ItemCategory, ItemCategoryCreateDto, ItemCategoryUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ItemCategory toEntity(ItemCategoryCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(ItemCategoryUpdateDto updateDto, @MappingTarget ItemCategory entity);

    @Override
    default void setTenantId(@MappingTarget ItemCategory entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(ItemCategory entity) {
        return entity.getId();
    }
}
