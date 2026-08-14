package ma.nafura.partner.mapper;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerContactCreateDto;
import ma.nafura.partner.api.request.PartnerContactUpdateDto;
import ma.nafura.partner.domain.model.PartnerContact;
import ma.nafura.platform.framework.mapper.EntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PartnerContactMapper
        extends EntityMapper<PartnerContact, PartnerContactCreateDto, PartnerContactUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    PartnerContact toEntity(PartnerContactCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "partnerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(PartnerContactUpdateDto updateDto, @MappingTarget PartnerContact entity);

    @Override
    default void setTenantId(@MappingTarget PartnerContact entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(PartnerContact entity) {
        return entity.getId();
    }
}
