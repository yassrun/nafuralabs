package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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

    private final PointageBatchRepository batchRepository;
    private final PointageRepository pointageRepository;
    private final EmployeRepository employeRepository;
    private final PointageSeedService seedService;
    private final ChantierCodeReader chantierCodeReader;

    public PointageBatchService(
            PointageBatchRepository batchRepository,
            PointageRepository pointageRepository,
            EmployeRepository employeRepository,
            PointageSeedService seedService,
            ChantierCodeReader chantierCodeReader) {
        this.batchRepository = batchRepository;
        this.pointageRepository = pointageRepository;
        this.employeRepository = employeRepository;
        this.seedService = seedService;
        this.chantierCodeReader = chantierCodeReader;
    }

    @Transactional(readOnly = true)
    public Optional<PointageBatchConflictDto> conflictForClientId(UUID clientId) {
        seedService.seedIfEmpty();
        return batchRepository.findByTenantIdAndClientId(tenantId(), clientId)
                .map(batch -> PointageBatchConflictDto.builder()
                        .message("Un lot de pointage existe déjà pour ce clientId")
                        .clientId(clientId.toString())
                        .existingBatchId(batch.getId().toString())
                        .build());
    }

    @Transactional
    public PointageBatchDto create(PointageBatchCreateDto request) {
        UUID tenantId = tenantId();
        String chantierId = request.getChantierId().trim();
        LocalDate datePointage = request.getDatePointage();

        if (request.getClientId() != null) {
            Optional<PointageBatchConflictDto> clientConflict = conflictForClientId(request.getClientId());
            if (clientConflict.isPresent()) {
                throw new PointageBatchDuplicateException(clientConflict.get());
            }
        }

        Optional<PointageBatch> existingBatch =
                batchRepository.findByTenantIdAndChantierIdAndDatePointage(tenantId, chantierId, datePointage);
        if (existingBatch.isPresent()) {
            throw new PointageBatchDuplicateException(PointageBatchConflictDto.builder()
                    .message("Un lot de pointage existe déjà pour ce chantier à cette date")
                    .chantierId(chantierId)
                    .datePointage(datePointage.toString())
                    .existingBatchId(existingBatch.get().getId().toString())
                    .build());
        }

        for (PointageInputDto input : request.getPointages()) {
            String employeId = input.getEmployeId().trim();
            LocalDate date = input.getDate();
            Optional<Pointage> existing = pointageRepository.findByTenantIdAndEmployeIdAndDateAndChantierId(
                    tenantId, employeId, date, chantierId);
            if (existing.isPresent()) {
                throw new PointageBatchDuplicateException(PointageBatchConflictDto.builder()
                        .message("Un pointage existe déjà pour cet employé sur ce chantier à cette date")
                        .employeId(employeId)
                        .chantierId(chantierId)
                        .datePointage(date.toString())
                        .existingPointageId(existing.get().getId().toString())
                        .build());
            }
        }

        String batchStatus = resolveBatchStatus(request.getStatus(), PointageBatch.STATUS_BROUILLON);

        PointageBatch batch = PointageBatch.builder()
                .tenantId(tenantId)
                .clientId(request.getClientId())
                .chefEmployeId(request.getChefEmployeId().trim())
                .chantierId(chantierId)
                .datePointage(datePointage)
                .gpsLat(request.getGpsLat())
                .gpsLng(request.getGpsLng())
                .signatureUrl(trimOrNull(request.getSignatureUrl()))
                .photoUrl(trimOrNull(request.getPhotoUrl()))
                .status(batchStatus)
                .build();
        batch = batchRepository.save(batch);

        List<Pointage> savedPointages = new ArrayList<>();
        for (PointageInputDto input : request.getPointages()) {
            Pointage pointage = Pointage.builder()
                    .tenantId(tenantId)
                    .batchId(batch.getId())
                    .employeId(input.getEmployeId().trim())
                    .chantierId(chantierId)
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
    public PointageBatchDto valider(UUID batchId) {
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
                .id(batch.getId().toString())
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
                .id(pointage.getId().toString())
                .date(pointage.getDate().toString())
                .chantierId(pointage.getChantierId())
                .chantierCode(chantierCodeReader.resolveCode(pointage.getTenantId(), pointage.getChantierId()))
                .employeId(pointage.getEmployeId())
                .employeNom(employeNom)
                .mode(pointage.getMode())
                .heureArrivee(pointage.getHeureArrivee())
                .heureDepart(pointage.getHeureDepart())
                .heuresNormales(pointage.getHeuresNormales())
                .heuresSup(pointage.getHeuresSup())
                .status(pointage.getStatus())
                .journeeBatchId(pointage.getBatchId().toString())
                .posteBudgetaireId(pointage.getPosteBudgetaireId())
                .build();
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
