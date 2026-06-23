package ma.nafura.stock.service;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.stock.api.request.MovementMotifCreateDto;
import ma.nafura.stock.api.request.MovementMotifUpdateDto;
import ma.nafura.stock.domain.model.MovementMotif;
import ma.nafura.stock.mapper.MovementMotifMapper;
import ma.nafura.stock.repository.MovementMotifRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class MovementMotifService
        extends JpaCrudService<UUID, MovementMotif, MovementMotifCreateDto, MovementMotifUpdateDto> {

    private final MovementMotifRepository movementMotifRepository;
    private final MovementMotifSeedService seedService;

    public MovementMotifService(
            MovementMotifRepository repository,
            MovementMotifMapper mapper,
            MovementMotifSeedService seedService) {
        super(repository, mapper);
        this.movementMotifRepository = repository;
        this.seedService = seedService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovementMotif> listPage(int page, int size) {
        seedService.seedIfEmpty();
        return super.listPage(page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovementMotif> listPage(int page, int size, Sort sort) {
        seedService.seedIfEmpty();
        return super.listPage(page, size, sort);
    }

    @Transactional(readOnly = true)
    public List<MovementMotif> listAll(String txType) {
        seedService.seedIfEmpty();
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
