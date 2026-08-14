package ma.nafura.partner.mapper;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerAddressCreateDto;
import ma.nafura.partner.api.request.PartnerAddressUpdateDto;
import ma.nafura.partner.domain.model.PartnerAddress;
import ma.nafura.platform.framework.mapper.EntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PartnerAddressMapper
        extends EntityMapper<PartnerAddress, PartnerAddressCreateDto, PartnerAddressUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    PartnerAddress toEntity(PartnerAddressCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "partnerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(PartnerAddressUpdateDto updateDto, @MappingTarget PartnerAddress entity);

    @Override
    default void setTenantId(@MappingTarget PartnerAddress entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(PartnerAddress entity) {
        return entity.getId();
    }
}
