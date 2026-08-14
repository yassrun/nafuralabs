package ma.nafura.catalogue.service;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.catalogue.api.request.MovementMotifCreateDto;
import ma.nafura.catalogue.api.request.MovementMotifUpdateDto;
import ma.nafura.catalogue.domain.model.MovementMotif;
import ma.nafura.catalogue.mapper.MovementMotifMapper;
import ma.nafura.catalogue.repository.MovementMotifRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class MovementMotifService
        extends JpaCrudService<UUID, MovementMotif, MovementMotifCreateDto, MovementMotifUpdateDto> {

    private final MovementMotifRepository movementMotifRepository;

    public MovementMotifService(MovementMotifRepository repository, MovementMotifMapper mapper) {
        super(repository, mapper);
        this.movementMotifRepository = repository;
    }

    @Transactional(readOnly = true)
    public List<MovementMotif> listAll(String txType) {
        UUID tenantId = TenantContext.getTenantId();
        if (StringUtils.hasText(txType)) {
            return movementMotifRepository.findByTenantIdAndTxTypeAndIsActiveTrueOrderByCodeAsc(
                    tenantId, txType.trim());
        }
        return movementMotifRepository.findByTenantIdOrderByTxTypeAscCodeAsc(tenantId);
    }

    @Transactional
    @Override
    public MovementMotif create(MovementMotifCreateDto request) {
        if (movementMotifRepository.existsByTenantIdAndCode(tenantId(), request.getCode().trim())) {
            throw new IllegalArgumentException("Movement motif code already exists");
        }
        return super.create(request);
    }
}
