package ma.nafura.platform.configuration.sysconfig.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.platform.configuration.sysconfig.domain.model.Calendar;
import ma.nafura.platform.configuration.sysconfig.api.request.CalendarCreateDto;
import ma.nafura.platform.configuration.sysconfig.api.request.CalendarUpdateDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for Calendar entity.
 * Auto-generated from calendar.entity.json — do not edit.
 */
@Mapper(componentModel = "spring")
public interface CalendarMapper extends EntityMapper<Calendar, CalendarCreateDto, CalendarUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Calendar toEntity(CalendarCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CalendarUpdateDto updateDto, @MappingTarget Calendar entity);

    @Override
    default void setTenantId(@MappingTarget Calendar entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(Calendar entity) {
        return entity.getId();
    }
}


