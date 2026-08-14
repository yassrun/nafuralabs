package ma.nafura.stock.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.stock.domain.model.Location;
import ma.nafura.stock.api.request.LocationCreateDto;
import ma.nafura.stock.api.request.LocationUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for Location entity.
 * Auto-generated from location.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface LocationMapper extends EntityMapper<Location, LocationCreateDto, LocationUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Location toEntity(LocationCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(LocationUpdateDto updateDto, @MappingTarget Location entity);

    @Override
    default void setTenantId(@MappingTarget Location entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(Location entity) {
        return entity.getId();
    }
}
