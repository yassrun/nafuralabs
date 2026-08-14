package ma.nafura.catalogue.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.catalogue.domain.model.Item;
import ma.nafura.catalogue.api.request.ItemCreateDto;
import ma.nafura.catalogue.api.request.ItemUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for Item entity.
 * Auto-generated from item.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface ItemMapper extends EntityMapper<Item, ItemCreateDto, ItemUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Item toEntity(ItemCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(ItemUpdateDto updateDto, @MappingTarget Item entity);

    @Override
    default void setTenantId(@MappingTarget Item entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(Item entity) {
        return entity.getId();
    }
}
