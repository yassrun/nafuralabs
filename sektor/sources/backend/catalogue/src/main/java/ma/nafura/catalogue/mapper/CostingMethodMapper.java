package ma.nafura.catalogue.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.catalogue.domain.model.CostingMethod;
import ma.nafura.catalogue.api.request.CostingMethodCreateDto;
import ma.nafura.catalogue.api.request.CostingMethodUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for CostingMethod entity.
 * Auto-generated from costing-method.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface CostingMethodMapper extends EntityMapper<CostingMethod, CostingMethodCreateDto, CostingMethodUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    CostingMethod toEntity(CostingMethodCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CostingMethodUpdateDto updateDto, @MappingTarget CostingMethod entity);

    @Override
    default void setTenantId(@MappingTarget CostingMethod entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(CostingMethod entity) {
        return entity.getId();
    }
}
