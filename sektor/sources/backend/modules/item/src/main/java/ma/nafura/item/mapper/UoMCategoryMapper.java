package ma.nafura.item.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.item.domain.model.UoMCategory;
import ma.nafura.item.api.request.UoMCategoryCreateDto;
import ma.nafura.item.api.request.UoMCategoryUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for UoMCategory entity.
 * Auto-generated from uo-mcategory.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface UoMCategoryMapper extends EntityMapper<UoMCategory, UoMCategoryCreateDto, UoMCategoryUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    UoMCategory toEntity(UoMCategoryCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(UoMCategoryUpdateDto updateDto, @MappingTarget UoMCategory entity);

    @Override
    default void setTenantId(@MappingTarget UoMCategory entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(UoMCategory entity) {
        return entity.getId();
    }
}
