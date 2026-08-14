package ma.nafura.item.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.item.domain.model.UnitOfMeasure;
import ma.nafura.item.api.request.UnitOfMeasureCreateDto;
import ma.nafura.item.api.request.UnitOfMeasureUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for UnitOfMeasure entity.
 * Auto-generated from unit-of-measure.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface UnitOfMeasureMapper extends EntityMapper<UnitOfMeasure, UnitOfMeasureCreateDto, UnitOfMeasureUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    UnitOfMeasure toEntity(UnitOfMeasureCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(UnitOfMeasureUpdateDto updateDto, @MappingTarget UnitOfMeasure entity);

    @Override
    default void setTenantId(@MappingTarget UnitOfMeasure entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(UnitOfMeasure entity) {
        return entity.getId();
    }
}
