package ma.nafura.partner.mapper;

import java.util.UUID;
import ma.nafura.partner.api.request.PartnerBankAccountCreateDto;
import ma.nafura.partner.api.request.PartnerBankAccountUpdateDto;
import ma.nafura.partner.domain.model.PartnerBankAccount;
import ma.nafura.platform.framework.mapper.EntityMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PartnerBankAccountMapper
        extends EntityMapper<PartnerBankAccount, PartnerBankAccountCreateDto, PartnerBankAccountUpdateDto> {

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    PartnerBankAccount toEntity(PartnerBankAccountCreateDto createDto);

    @Override
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "partnerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(PartnerBankAccountUpdateDto updateDto, @MappingTarget PartnerBankAccount entity);

    @Override
    default void setTenantId(@MappingTarget PartnerBankAccount entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    default Object getId(PartnerBankAccount entity) {
        return entity.getId();
    }
}
