package ma.nafura.platform.configuration.sysconfig.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.platform.configuration.sysconfig.domain.model.NumberingSequence;
import ma.nafura.platform.configuration.sysconfig.api.request.NumberingSequenceCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.NumberingSequenceUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for NumberingSequence entity.
 * Auto-generated from numbering-sequence.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface NumberingSequenceMapper extends EntityMapper<NumberingSequence, NumberingSequenceCreateDto, NumberingSequenceUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    NumberingSequence toEntity(NumberingSequenceCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(NumberingSequenceUpdateDto updateDto, @MappingTarget NumberingSequence entity);

    @Override
    default void setTenantId(@MappingTarget NumberingSequence entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(NumberingSequence entity) {
        return entity.getId();
    }
}


