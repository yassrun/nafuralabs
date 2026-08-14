package ma.nafura.platform.configuration.sysconfig.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.platform.configuration.sysconfig.domain.model.Tag;
import ma.nafura.platform.configuration.sysconfig.api.request.TagCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.TagUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for Tag entity.
 * Auto-generated from tag.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface TagMapper extends EntityMapper<Tag, TagCreateDto, TagUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Tag toEntity(TagCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(TagUpdateDto updateDto, @MappingTarget Tag entity);

    @Override
    default void setTenantId(@MappingTarget Tag entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(Tag entity) {
        return entity.getId();
    }
}


