package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.dto.ChantierPointageSyntheseDto;
import ma.nafura.rh.api.dto.PointageDto;
import ma.nafura.rh.api.request.PointageUpdateDto;
import ma.nafura.rh.domain.model.Pointage;
import ma.nafura.rh.repository.PointageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PointageService {

    private final PointageRepository repository;
    private final PointageBatchService batchService;
    private final PointageSeedService seedService;

    public PointageService(
            PointageRepository repository,
            PointageBatchService batchService,
            PointageSeedService seedService) {
        this.repository = repository;
        this.batchService = batchService;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<PointageDto> list(String chantierId, LocalDate date, LocalDate from, LocalDate to) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Pointage> rows;
        String normalizedChantier = normalizeFilter(chantierId);

        if (date != null) {
            rows = normalizedChantier != null
                    ? repository.findByTenantIdAndChantierIdAndDateOrderByEmployeIdAsc(tenantId, normalizedChantier, date)
                    : repository.findByTenantIdAndDateOrderByEmployeIdAsc(tenantId, date);
        } else if (from != null && to != null) {
            rows = normalizedChantier != null
                    ? repository.findByTenantIdAndChantierIdAndDateBetweenOrderByDateAscEmployeIdAsc(
                            tenantId, normalizedChantier, from, to)
                    : repository.findByTenantIdAndDateBetweenOrderByDateAscEmployeIdAsc(tenantId, from, to);
        } else if (from != null) {
            rows = normalizedChantier != null
                    ? repository.findByTenantIdAndChantierIdAndDateBetweenOrderByDateAscEmployeIdAsc(
                            tenantId, normalizedChantier, from, from)
                    : repository.findByTenantIdAndDateBetweenOrderByDateAscEmployeIdAsc(tenantId, from, from);
        } else {
            LocalDate defaultFrom = LocalDate.of(2026, 1, 1);
            LocalDate defaultTo = LocalDate.of(2099, 12, 31);
            rows = normalizedChantier != null
                    ? repository.findByTenantIdAndChantierIdAndDateBetweenOrderByDateAscEmployeIdAsc(
                            tenantId, normalizedChantier, defaultFrom, defaultTo)
                    : repository.findByTenantIdAndDateBetweenOrderByDateAscEmployeIdAsc(tenantId, defaultFrom, defaultTo);
        }
        return rows.stream().map(batchService::toPointageDto).toList();
    }

    @Transactional(readOnly = true)
    public List<PointageDto> listByEmploye(String employeId, LocalDate from, LocalDate to) {
        seedService.seedIfEmpty();
        if (!StringUtils.hasText(employeId)) {
            throw new IllegalArgumentException("employeId is required");
        }
        if (from == null || to == null) {
            throw new IllegalArgumentException("from and to are required");
        }
        return repository
                .findByTenantIdAndEmployeIdAndDateBetweenOrderByDateAsc(tenantId(), employeId.trim(), from, to)
                .stream()
                .map(batchService::toPointageDto)
                .toList();
    }

    @Transactional
    public PointageDto update(String id, PointageUpdateDto request) {
        seedService.seedIfEmpty();
        Pointage entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Pointage not found"));

        if (request.getMode() != null) {
            entity.setMode(request.getMode().trim().toUpperCase(Locale.ROOT));
        }
        if (request.getHeureArrivee() != null) {
            entity.setHeureArrivee(trimOrNull(request.getHeureArrivee()));
        }
        if (request.getHeureDepart() != null) {
            entity.setHeureDepart(trimOrNull(request.getHeureDepart()));
        }
        if (request.getHeuresNormales() != null) {
            entity.setHeuresNormales(request.getHeuresNormales());
        }
        if (request.getHeuresSup() != null) {
            entity.setHeuresSup(request.getHeuresSup());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus().trim().toUpperCase(Locale.ROOT));
        }
        if (request.getPosteBudgetaireId() != null) {
            entity.setPosteBudgetaireId(trimOrNull(request.getPosteBudgetaireId()));
        }

        return batchService.toPointageDto(repository.save(entity));
    }

    @Transactional(readOnly = true)
    public ChantierPointageSyntheseDto syntheseChantier(String chantierId, LocalDate from, LocalDate to) {
        seedService.seedIfEmpty();
        if (!StringUtils.hasText(chantierId)) {
            throw new IllegalArgumentException("chantierId is required");
        }
        LocalDate effectiveFrom = from != null ? from : LocalDate.of(2026, 1, 1);
        LocalDate effectiveTo = to != null ? to : LocalDate.now();

        List<Pointage> rows = repository.findByTenantIdAndChantierIdAndDateBetweenOrderByDateAscEmployeIdAsc(
                tenantId(), chantierId.trim(), effectiveFrom, effectiveTo);

        BigDecimal heuresNormales = BigDecimal.ZERO;
        BigDecimal heuresSup = BigDecimal.ZERO;
        long joursPresents = 0;
        for (Pointage row : rows) {
            if (Pointage.STATUS_VALIDE.equals(row.getStatus())) {
                heuresNormales = heuresNormales.add(row.getHeuresNormales());
                heuresSup = heuresSup.add(row.getHeuresSup());
                if (Pointage.MODE_PRESENT.equals(row.getMode())) {
                    joursPresents++;
                }
            }
        }

        return ChantierPointageSyntheseDto.builder()
                .chantierId(chantierId.trim())
                .from(effectiveFrom.toString())
                .to(effectiveTo.toString())
                .joursPointes(rows.size())
                .joursPresents(joursPresents)
                .heuresNormales(heuresNormales)
                .heuresSup(heuresSup)
                .heuresTotal(heuresNormales.add(heuresSup))
                .build();
    }

    private String normalizeFilter(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
