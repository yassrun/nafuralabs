package ma.nafura.item.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.item.domain.model.ItemPrice;
import ma.nafura.item.api.request.ItemPriceCreateDto;
import ma.nafura.item.api.request.ItemPriceUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for ItemPrice entity.
 * Auto-generated from item-price.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface ItemPriceMapper extends EntityMapper<ItemPrice, ItemPriceCreateDto, ItemPriceUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ItemPrice toEntity(ItemPriceCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(ItemPriceUpdateDto updateDto, @MappingTarget ItemPrice entity);

    @Override
    default void setTenantId(@MappingTarget ItemPrice entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(ItemPrice entity) {
        return entity.getId();
    }
}
