package ma.nafura.platform.configuration.sysconfig.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.platform.configuration.sysconfig.domain.model.ReferenceValue;
import ma.nafura.platform.configuration.sysconfig.api.request.ReferenceValueCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.ReferenceValueUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for ReferenceValue entity.
 * Auto-generated from reference-value.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface ReferenceValueMapper extends EntityMapper<ReferenceValue, ReferenceValueCreateDto, ReferenceValueUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ReferenceValue toEntity(ReferenceValueCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(ReferenceValueUpdateDto updateDto, @MappingTarget ReferenceValue entity);

    @Override
    default void setTenantId(@MappingTarget ReferenceValue entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(ReferenceValue entity) {
        return entity.getId();
    }
}


