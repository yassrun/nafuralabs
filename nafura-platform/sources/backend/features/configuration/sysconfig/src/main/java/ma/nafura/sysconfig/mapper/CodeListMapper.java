package ma.nafura.platform.configuration.sysconfig.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.platform.configuration.sysconfig.domain.model.CodeList;
import ma.nafura.platform.configuration.sysconfig.api.request.CodeListCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.CodeListUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for CodeList entity.
 * Auto-generated from code-list.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface CodeListMapper extends EntityMapper<CodeList, CodeListCreateDto, CodeListUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    CodeList toEntity(CodeListCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CodeListUpdateDto updateDto, @MappingTarget CodeList entity);

    @Override
    default void setTenantId(@MappingTarget CodeList entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(CodeList entity) {
        return entity.getId();
    }
}


