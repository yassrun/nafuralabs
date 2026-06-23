package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.dto.PointageBatchConflictDto;
import ma.nafura.rh.api.dto.PointageBatchDto;
import ma.nafura.rh.api.dto.PointageDto;
import ma.nafura.rh.api.request.PointageBatchCreateDto;
import ma.nafura.rh.api.request.PointageInputDto;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.domain.model.Pointage;
import ma.nafura.rh.domain.model.PointageBatch;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.PointageBatchRepository;
import ma.nafura.rh.repository.PointageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PointageBatchService {

    private static final Map<String, String> CHANTIER_CODES = Map.of(
            "ch-001", "CH-2025-001",
            "ch-002", "CH-2025-002",
            "ch-003", "CH-2025-003");

    private final PointageBatchRepository batchRepository;
    private final PointageRepository pointageRepository;
    private final EmployeRepository employeRepository;
    private final PointageSeedService seedService;

    public PointageBatchService(
            PointageBatchRepository batchRepository,
            PointageRepository pointageRepository,
            EmployeRepository employeRepository,
            PointageSeedService seedService) {
        this.batchRepository = batchRepository;
        this.pointageRepository = pointageRepository;
        this.employeRepository = employeRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public Optional<PointageBatchConflictDto> conflictForClientId(UUID clientId) {
        seedService.seedIfEmpty();
        return batchRepository.findByTenantIdAndClientId(tenantId(), clientId)
                .map(batch -> PointageBatchConflictDto.builder()
                        .message("Pointage batch already exists for clientId")
                        .clientId(clientId.toString())
                        .existingBatchId(batch.getId())
                        .build());
    }

    @Transactional
    public PointageBatchDto create(PointageBatchCreateDto request) {
        UUID tenantId = tenantId();
        Optional<PointageBatchConflictDto> conflict = conflictForClientId(request.getClientId());
        if (conflict.isPresent()) {
            throw new PointageBatchDuplicateException(conflict.get());
        }

        String batchId = nextBatchId(tenantId, request.getDatePointage(), request.getChantierId());
        String batchStatus = resolveBatchStatus(request.getStatus(), PointageBatch.STATUS_BROUILLON);

        PointageBatch batch = PointageBatch.builder()
                .id(batchId)
                .tenantId(tenantId)
                .clientId(request.getClientId())
                .chefEmployeId(request.getChefEmployeId().trim())
                .chantierId(request.getChantierId().trim())
                .datePointage(request.getDatePointage())
                .gpsLat(request.getGpsLat())
                .gpsLng(request.getGpsLng())
                .signatureUrl(trimOrNull(request.getSignatureUrl()))
                .photoUrl(trimOrNull(request.getPhotoUrl()))
                .status(batchStatus)
                .build();
        batchRepository.save(batch);

        List<Pointage> savedPointages = new ArrayList<>();
        for (PointageInputDto input : request.getPointages()) {
            String pointageId = StringUtils.hasText(input.getId())
                    ? input.getId().trim()
                    : defaultPointageId(input.getDate(), input.getEmployeId());
            Pointage pointage = Pointage.builder()
                    .id(pointageId)
                    .tenantId(tenantId)
                    .batchId(batchId)
                    .employeId(input.getEmployeId().trim())
                    .chantierId(request.getChantierId().trim())
                    .date(input.getDate())
                    .mode(resolveMode(input.getMode()))
                    .heureArrivee(trimOrNull(input.getHeureArrivee()))
                    .heureDepart(trimOrNull(input.getHeureDepart()))
                    .heuresNormales(defaultAmount(input.getHeuresNormales()))
                    .heuresSup(defaultAmount(input.getHeuresSup()))
                    .status(resolvePointageStatus(input.getStatus(), batchStatus))
                    .posteBudgetaireId(trimOrNull(input.getPosteBudgetaireId()))
                    .build();
            savedPointages.add(pointageRepository.save(pointage));
        }

        return toDto(batch, savedPointages);
    }

    @Transactional
    public PointageBatchDto valider(String batchId) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        PointageBatch batch = batchRepository
                .findByIdAndTenantId(batchId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Pointage batch not found"));

        batch.setStatus(PointageBatch.STATUS_VALIDE);
        batchRepository.save(batch);

        List<Pointage> pointages = pointageRepository.findByTenantIdAndBatchIdOrderByEmployeIdAsc(tenantId, batchId);
        for (Pointage pointage : pointages) {
            pointage.setStatus(Pointage.STATUS_VALIDE);
        }
        pointageRepository.saveAll(pointages);

        return toDto(batch, pointages);
    }

    private PointageBatchDto toDto(PointageBatch batch, List<Pointage> pointages) {
        return PointageBatchDto.builder()
                .id(batch.getId())
                .clientId(batch.getClientId() != null ? batch.getClientId().toString() : null)
                .chefEmployeId(batch.getChefEmployeId())
                .chantierId(batch.getChantierId())
                .datePointage(batch.getDatePointage().toString())
                .gpsLat(batch.getGpsLat())
                .gpsLng(batch.getGpsLng())
                .signatureUrl(batch.getSignatureUrl())
                .photoUrl(batch.getPhotoUrl())
                .status(batch.getStatus())
                .createdAt(batch.getCreatedAt())
                .pointages(pointages.stream().map(this::toPointageDto).toList())
                .build();
    }

    PointageDto toPointageDto(Pointage pointage) {
        Employe employe = employeRepository
                .findByIdAndTenantId(pointage.getEmployeId(), pointage.getTenantId())
                .orElse(null);
        String employeNom = employe != null ? employe.getPrenom() + " " + employe.getNom() : pointage.getEmployeId();
        return PointageDto.builder()
                .id(pointage.getId())
                .date(pointage.getDate().toString())
                .chantierId(pointage.getChantierId())
                .chantierCode(CHANTIER_CODES.getOrDefault(pointage.getChantierId(), pointage.getChantierId()))
                .employeId(pointage.getEmployeId())
                .employeNom(employeNom)
                .mode(pointage.getMode())
                .heureArrivee(pointage.getHeureArrivee())
                .heureDepart(pointage.getHeureDepart())
                .heuresNormales(pointage.getHeuresNormales())
                .heuresSup(pointage.getHeuresSup())
                .status(pointage.getStatus())
                .journeeBatchId(pointage.getBatchId())
                .posteBudgetaireId(pointage.getPosteBudgetaireId())
                .build();
    }

    private String nextBatchId(UUID tenantId, LocalDate date, String chantierId) {
        String prefix = "pb-" + date + "-" + chantierId;
        int suffix = 0;
        for (PointageBatch batch : batchRepository.findByTenantIdAndChantierIdAndDatePointageOrderByCreatedAtDesc(
                tenantId, chantierId, date)) {
            if (batch.getId().equals(prefix) || batch.getId().startsWith(prefix + "-")) {
                suffix++;
            }
        }
        return suffix == 0 ? prefix : prefix + "-" + suffix;
    }

    private static String defaultPointageId(LocalDate date, String employeId) {
        return "pt-" + date + "-" + employeId;
    }

    private static String resolveBatchStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case PointageBatch.STATUS_BROUILLON,
                    PointageBatch.STATUS_SOUMIS,
                    PointageBatch.STATUS_VALIDE,
                    PointageBatch.STATUS_REJETE -> normalized;
            default -> fallback;
        };
    }

    private static String resolvePointageStatus(String requested, String batchStatus) {
        if (StringUtils.hasText(requested)) {
            String normalized = requested.trim().toUpperCase(Locale.ROOT);
            if (Pointage.STATUS_BROUILLON.equals(normalized)
                    || Pointage.STATUS_VALIDE.equals(normalized)
                    || Pointage.STATUS_CONTESTE.equals(normalized)) {
                return normalized;
            }
        }
        if (PointageBatch.STATUS_VALIDE.equals(batchStatus)) {
            return Pointage.STATUS_VALIDE;
        }
        return Pointage.STATUS_BROUILLON;
    }

    private static String resolveMode(String mode) {
        if (!StringUtils.hasText(mode)) {
            return Pointage.MODE_PRESENT;
        }
        String normalized = mode.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case Pointage.MODE_PRESENT,
                    Pointage.MODE_ABSENT,
                    Pointage.MODE_CONGE,
                    Pointage.MODE_MALADIE,
                    Pointage.MODE_FORMATION,
                    Pointage.MODE_AUTRE -> normalized;
            default -> Pointage.MODE_AUTRE;
        };
    }

    private static BigDecimal defaultAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
