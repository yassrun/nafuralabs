package ma.nafura.partner.mapper;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerCreateDto;
import ma.nafura.partner.api.request.PartnerUpdateDto;
import ma.nafura.partner.domain.model.Partner;
import ma.nafura.platform.framework.mapper.EntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PartnerMapper extends EntityMapper<Partner, PartnerCreateDto, PartnerUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Partner toEntity(PartnerCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(PartnerUpdateDto updateDto, @MappingTarget Partner entity);

    @Override
    default void setTenantId(@MappingTarget Partner entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(Partner entity) {
        return entity.getId();
    }
}
