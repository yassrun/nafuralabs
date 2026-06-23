package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.dto.PlanningAffectationDto;
import ma.nafura.rh.api.dto.PlanningEntryDto;
import ma.nafura.rh.api.dto.PlanningResultDto;
import ma.nafura.rh.domain.model.Conge;
import ma.nafura.rh.domain.model.Pointage;
import ma.nafura.rh.repository.CongeRepository;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.PointageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PlanningReadService {

    private static final Map<String, String> CHANTIER_CODES = Map.of(
            "ch-001", "CH-2025-001",
            "ch-002", "CH-2025-002",
            "ch-003", "CH-2025-003");

    private static final Set<String> CONGE_STATUSES = Set.of(Conge.STATUS_APPROUVE, Conge.STATUS_EN_COURS);

    private final PointageRepository pointageRepository;
    private final CongeRepository congeRepository;
    private final EmployeRepository employeRepository;
    private final PointageSeedService pointageSeedService;
    private final CongeSeedService congeSeedService;

    public PlanningReadService(
            PointageRepository pointageRepository,
            CongeRepository congeRepository,
            EmployeRepository employeRepository,
            PointageSeedService pointageSeedService,
            CongeSeedService congeSeedService) {
        this.pointageRepository = pointageRepository;
        this.congeRepository = congeRepository;
        this.employeRepository = employeRepository;
        this.pointageSeedService = pointageSeedService;
        this.congeSeedService = congeSeedService;
    }

    @Transactional(readOnly = true)
    public PlanningResultDto read(LocalDate from, LocalDate to, String chantierId, String employeId) {
        pointageSeedService.seedIfEmpty();
        congeSeedService.seedIfEmpty();

        if (from == null || to == null) {
            throw new IllegalArgumentException("from and to are required");
        }
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("from must be on or before to");
        }

        UUID tenantId = tenantId();
        String normalizedChantier = normalizeFilter(chantierId);
        String normalizedEmploye = normalizeFilter(employeId);

        List<Pointage> pointages = loadPointages(tenantId, from, to, normalizedChantier, normalizedEmploye);
        Map<String, PlanningEntryDto> entriesByKey = new LinkedHashMap<>();

        for (Pointage pointage : pointages) {
            String key = entryKey(pointage.getEmployeId(), pointage.getDate(), pointage.getChantierId());
            PlanningEntryDto existing = entriesByKey.get(key);
            BigDecimal hours = pointage.getHeuresNormales().add(pointage.getHeuresSup());
            if (existing == null) {
                entriesByKey.put(key, toEntry(pointage, hours, tenantId));
            } else {
                existing.setPointageHeures(existing.getPointageHeures().add(hours));
                if (!StringUtils.hasText(existing.getMode())) {
                    existing.setMode(pointage.getMode());
                }
            }
        }

        List<Conge> conges = congeRepository
                .findByTenantIdAndStatusInAndDateDebutLessThanEqualAndDateFinGreaterThanEqualOrderByDateDebutAsc(
                        tenantId, CONGE_STATUSES, to, from)
                .stream()
                .filter(c -> normalizedEmploye == null || normalizedEmploye.equals(c.getEmployeId()))
                .toList();

        for (Conge conge : conges) {
            LocalDate day = conge.getDateDebut().isBefore(from) ? from : conge.getDateDebut();
            LocalDate last = conge.getDateFin().isAfter(to) ? to : conge.getDateFin();
            for (LocalDate cursor = day; !cursor.isAfter(last); cursor = cursor.plusDays(1)) {
                applyConge(entriesByKey, conge, cursor, tenantId);
            }
        }

        List<PlanningEntryDto> entries = entriesByKey.values().stream()
                .sorted(Comparator
                        .comparing(PlanningEntryDto::getDateJour)
                        .thenComparing(PlanningEntryDto::getEmployeNom, Comparator.nullsLast(String::compareTo))
                        .thenComparing(PlanningEntryDto::getChantierId, Comparator.nullsLast(String::compareTo)))
                .toList();

        return PlanningResultDto.builder()
                .entries(entries)
                .affectations(buildAffectations(pointages, tenantId))
                .build();
    }

    private List<Pointage> loadPointages(
            UUID tenantId, LocalDate from, LocalDate to, String chantierId, String employeId) {
        if (employeId != null && chantierId != null) {
            return pointageRepository
                    .findByTenantIdAndEmployeIdAndDateBetweenOrderByDateAsc(tenantId, employeId, from, to)
                    .stream()
                    .filter(p -> chantierId.equals(p.getChantierId()))
                    .toList();
        }
        if (employeId != null) {
            return pointageRepository.findByTenantIdAndEmployeIdAndDateBetweenOrderByDateAsc(
                    tenantId, employeId, from, to);
        }
        if (chantierId != null) {
            return pointageRepository.findByTenantIdAndChantierIdAndDateBetweenOrderByDateAscEmployeIdAsc(
                    tenantId, chantierId, from, to);
        }
        return pointageRepository.findByTenantIdAndDateBetweenOrderByDateAscEmployeIdAsc(tenantId, from, to);
    }

    private void applyConge(
            Map<String, PlanningEntryDto> entriesByKey, Conge conge, LocalDate date, UUID tenantId) {
        String employeId = conge.getEmployeId();
        boolean updated = false;
        for (Map.Entry<String, PlanningEntryDto> entry : entriesByKey.entrySet()) {
            if (!entry.getKey().startsWith(employeId + "|" + date + "|")) {
                continue;
            }
            entry.getValue().setCongeType(conge.getType());
            entry.getValue().setMode(Pointage.MODE_CONGE);
            updated = true;
        }
        if (!updated) {
            String key = entryKey(employeId, date, null);
            entriesByKey.put(
                    key,
                    PlanningEntryDto.builder()
                            .employeId(employeId)
                            .employeNom(resolveEmployeNom(employeId, conge.getEmployeNom(), tenantId))
                            .dateJour(date.toString())
                            .pointageHeures(BigDecimal.ZERO)
                            .congeType(conge.getType())
                            .mode(Pointage.MODE_CONGE)
                            .build());
        }
    }

    private List<PlanningAffectationDto> buildAffectations(List<Pointage> pointages, UUID tenantId) {
        Map<String, AffectationAccumulator> accumulators = new HashMap<>();
        for (Pointage pointage : pointages) {
            String pairKey = pointage.getEmployeId() + "|" + pointage.getChantierId();
            AffectationAccumulator acc = accumulators.computeIfAbsent(
                    pairKey, k -> new AffectationAccumulator(pointage));
            acc.register(pointage.getDate());
        }

        List<PlanningAffectationDto> affectations = new ArrayList<>();
        for (AffectationAccumulator acc : accumulators.values()) {
            affectations.add(PlanningAffectationDto.builder()
                    .id("aff-" + acc.employeId + "-" + acc.chantierId)
                    .employeId(acc.employeId)
                    .employeNom(resolveEmployeNom(acc.employeId, null, tenantId))
                    .chantierId(acc.chantierId)
                    .chantierCode(acc.chantierCode)
                    .dateDebut(acc.minDate.toString())
                    .dateFin(acc.maxDate.toString())
                    .pourcentageTemps(100)
                    .build());
        }
        affectations.sort(Comparator.comparing(PlanningAffectationDto::getEmployeNom)
                .thenComparing(PlanningAffectationDto::getChantierCode));
        return affectations;
    }

    private PlanningEntryDto toEntry(Pointage pointage, BigDecimal hours, UUID tenantId) {
        return PlanningEntryDto.builder()
                .employeId(pointage.getEmployeId())
                .employeNom(resolveEmployeNom(pointage.getEmployeId(), null, tenantId))
                .dateJour(pointage.getDate().toString())
                .chantierId(pointage.getChantierId())
                .chantierCode(chantierCode(pointage.getChantierId()))
                .pointageHeures(hours)
                .mode(pointage.getMode())
                .build();
    }

    private String resolveEmployeNom(String employeId, String fallback, UUID tenantId) {
        if (StringUtils.hasText(fallback)) {
            return fallback.trim();
        }
        return employeRepository
                .findByIdAndTenantId(employeId, tenantId)
                .map(e -> e.getPrenom() + " " + e.getNom())
                .orElse(employeId);
    }

    private static String entryKey(String employeId, LocalDate date, String chantierId) {
        return employeId + "|" + date + "|" + (chantierId != null ? chantierId : "");
    }

    private static String chantierCode(String chantierId) {
        return CHANTIER_CODES.getOrDefault(chantierId, chantierId);
    }

    private static String normalizeFilter(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private static final class AffectationAccumulator {
        private final String employeId;
        private final String chantierId;
        private final String chantierCode;
        private LocalDate minDate;
        private LocalDate maxDate;

        private AffectationAccumulator(Pointage seed) {
            employeId = seed.getEmployeId();
            chantierId = seed.getChantierId();
            chantierCode = chantierCode(chantierId);
            minDate = seed.getDate();
            maxDate = seed.getDate();
        }

        private void register(LocalDate date) {
            if (date.isBefore(minDate)) {
                minDate = date;
            }
            if (date.isAfter(maxDate)) {
                maxDate = date;
            }
        }
    }
}
