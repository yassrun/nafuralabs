package ma.nafura.stock.mapper;

import java.util.UUID;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.stock.api.request.MovementMotifCreateDto;
import ma.nafura.stock.api.request.MovementMotifUpdateDto;
import ma.nafura.stock.domain.model.MovementMotif;
import org.springframework.stereotype.Component;

@Component
public class MovementMotifMapper
        implements EntityMapper<MovementMotif, MovementMotifCreateDto, MovementMotifUpdateDto> {

    @Override
    public MovementMotif toEntity(MovementMotifCreateDto createDto) {
        return MovementMotif.builder()
                .code(createDto.getCode().trim())
                .name(createDto.getName().trim())
                .txType(createDto.getTxType().trim())
                .isActive(createDto.getIsActive() != null ? createDto.getIsActive() : true)
                .build();
    }

    @Override
    public void updateEntity(MovementMotifUpdateDto updateDto, MovementMotif entity) {
        if (updateDto.getCode() != null) {
            entity.setCode(updateDto.getCode().trim());
        }
        if (updateDto.getName() != null) {
            entity.setName(updateDto.getName().trim());
        }
        if (updateDto.getTxType() != null) {
            entity.setTxType(updateDto.getTxType().trim());
        }
        if (updateDto.getIsActive() != null) {
            entity.setIsActive(updateDto.getIsActive());
        }
    }

    @Override
    public void setTenantId(MovementMotif entity, UUID tenantId) {
        entity.setTenantId(tenantId);
    }

    @Override
    public Object getId(MovementMotif entity) {
        return entity.getId();
    }
}
