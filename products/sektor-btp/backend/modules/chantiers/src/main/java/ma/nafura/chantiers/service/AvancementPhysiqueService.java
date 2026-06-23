package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.AvancementPhysiqueDto;
import ma.nafura.chantiers.api.request.AvancementPhysiqueCreateDto;
import ma.nafura.chantiers.api.request.AvancementPhysiqueEntryDto;
import ma.nafura.chantiers.api.request.AvancementPhysiqueUpdateDto;
import ma.nafura.chantiers.domain.model.AvancementPhysique;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.chantiers.domain.model.PosteBudgetaire;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AvancementPhysiqueService {

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final AvancementPhysiqueRepository repository;
    private final ChantierService chantierService;
    private final ChantierLotRepository lotRepository;
    private final PosteBudgetaireRepository posteRepository;
    private final ChantierProgressSyncService progressSyncService;

    public AvancementPhysiqueService(
            AvancementPhysiqueRepository repository,
            ChantierService chantierService,
            ChantierLotRepository lotRepository,
            PosteBudgetaireRepository posteRepository,
            ChantierProgressSyncService progressSyncService) {
        this.repository = repository;
        this.chantierService = chantierService;
        this.lotRepository = lotRepository;
        this.posteRepository = posteRepository;
        this.progressSyncService = progressSyncService;
    }

    @Transactional(readOnly = true)
    public List<AvancementPhysiqueDto> listByChantier(String chantierId) {
        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        List<AvancementPhysique> rows =
                repository.findByTenantIdAndChantierIdOrderByDateSaisieDescCreatedAtDesc(tenantId, chantierId);
        Map<String, ChantierLot> lotsById = indexLots(tenantId, chantierId);
        Map<String, BigDecimal> runningCumuls = new HashMap<>();
        Map<String, BigDecimal> cumulsByRowId = new HashMap<>();
        List<AvancementPhysiqueDto> dtos = new ArrayList<>();

        List<AvancementPhysique> chronological = rows.stream()
                .sorted(Comparator
                        .comparing(AvancementPhysique::getLotId, Comparator.nullsLast(String::compareTo))
                        .thenComparing(AvancementPhysique::getPosteId, Comparator.nullsLast(String::compareTo))
                        .thenComparing(AvancementPhysique::getDateSaisie)
                        .thenComparing(AvancementPhysique::getCreatedAt))
                .toList();

        for (AvancementPhysique row : chronological) {
            String key = progressKey(row.getLotId(), row.getPosteId());
            BigDecimal previous = runningCumuls.getOrDefault(key, BigDecimal.ZERO);
            BigDecimal cumul = previous.add(row.getQuantiteRealisee());
            runningCumuls.put(key, cumul);
            cumulsByRowId.put(row.getId(), cumul);
        }

        for (AvancementPhysique row : rows) {
            dtos.add(toDto(
                    row,
                    chantier,
                    lotsById.get(row.getLotId()),
                    cumulsByRowId.getOrDefault(row.getId(), row.getQuantiteRealisee())));
        }
        return dtos;
    }

    @Transactional
    public List<AvancementPhysiqueDto> create(String chantierId, AvancementPhysiqueCreateDto request) {
        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        Map<String, ChantierLot> lotsById = indexLots(tenantId, chantierId);
        List<AvancementPhysique> created = new ArrayList<>();

        for (int index = 0; index < request.getEntries().size(); index++) {
            AvancementPhysiqueEntryDto entry = request.getEntries().get(index);
            validateEntry(entry);

            ChantierLot lot = resolveLot(tenantId, chantierId, entry, lotsById);
            PosteBudgetaire poste = resolvePoste(tenantId, entry);

            BigDecimal previousCumul = computePreviousCumul(tenantId, lot != null ? lot.getId() : null, entry.getPosteId());
            BigDecimal quantite = entry.getQuantiteRealisee();
            BigDecimal cumul = previousCumul.add(quantite);
            BigDecimal pourcentage = computePourcentage(cumul, lot, poste);

            AvancementPhysique entity = AvancementPhysique.builder()
                    .id(buildId(chantierId, index))
                    .tenantId(tenantId)
                    .chantierId(chantierId)
                    .lotId(lot != null ? lot.getId() : trimOrNull(entry.getLotId()))
                    .posteId(poste != null ? poste.getId() : trimOrNull(entry.getPosteId()))
                    .dateSaisie(request.getDate())
                    .quantiteRealisee(quantite)
                    .pourcentage(pourcentage)
                    .notes(trimOrNull(entry.getNotes()))
                    .status(request.getStatus().trim())
                    .saisieParId(request.getSaisieParId().trim())
                    .saisieParName(trimOrNull(request.getSaisieParName()))
                    .build();
            created.add(repository.save(entity));
        }

        progressSyncService.syncFromAvancements(chantierId);

        return created.stream()
                .map(row -> toDto(
                        row,
                        chantier,
                        lotsById.get(row.getLotId()),
                        computeCumulForRow(tenantId, row)))
                .toList();
    }

    @Transactional
    public List<AvancementPhysiqueDto> findDernierByChantier(String chantierId) {
        progressSyncService.syncFromAvancements(chantierId);
        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        List<AvancementPhysique> rows =
                repository.findByTenantIdAndChantierIdOrderByDateSaisieDescCreatedAtDesc(tenantId, chantierId);
        Map<String, ChantierLot> lotsById = indexLots(tenantId, chantierId);
        Map<String, AvancementPhysique> dernierByKey = new HashMap<>();

        for (AvancementPhysique row : rows) {
            String key = progressKey(row.getLotId(), row.getPosteId());
            dernierByKey.putIfAbsent(key, row);
        }

        return dernierByKey.values().stream()
                .sorted(Comparator
                        .comparing(AvancementPhysique::getDateSaisie)
                        .reversed()
                        .thenComparing(AvancementPhysique::getCreatedAt, Comparator.reverseOrder()))
                .map(row -> toDto(
                        row,
                        chantier,
                        lotsById.get(row.getLotId()),
                        computeCumulForRow(tenantId, row)))
                .toList();
    }

    @Transactional
    public AvancementPhysiqueDto update(String id, AvancementPhysiqueUpdateDto request) {
        AvancementPhysique entity = getById(id);
        Chantier chantier = chantierService.getById(entity.getChantierId());
        UUID tenantId = tenantId();

        if (request.getDate() != null) {
            entity.setDateSaisie(request.getDate());
        }
        if (request.getQuantiteRealisee() != null) {
            if (request.getQuantiteRealisee().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("quantiteRealisee must be positive");
            }
            entity.setQuantiteRealisee(request.getQuantiteRealisee());
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (StringUtils.hasText(request.getStatus())) {
            entity.setStatus(request.getStatus().trim());
        }

        ChantierLot lot = resolveLotForEntity(tenantId, entity);
        PosteBudgetaire poste = resolvePosteForEntity(tenantId, entity);
        BigDecimal cumul = computeUpdatedCumul(tenantId, entity);
        entity.setPourcentage(computePourcentage(cumul, lot, poste));

        AvancementPhysique saved = repository.save(entity);
        progressSyncService.syncFromAvancements(saved.getChantierId());
        return toDto(saved, chantier, lot, cumul);
    }

    @Transactional
    public AvancementPhysiqueDto valider(String id) {
        AvancementPhysique entity = getById(id);
        entity.setStatus(AvancementPhysique.STATUS_VALIDE);
        AvancementPhysique saved = repository.save(entity);

        progressSyncService.syncFromAvancements(saved.getChantierId());

        Chantier chantier = chantierService.getById(saved.getChantierId());
        ChantierLot lot = resolveLotForEntity(tenantId(), saved);
        BigDecimal cumul = computeCumulForRow(tenantId(), saved);
        return toDto(saved, chantier, lot, cumul);
    }

    private AvancementPhysique getById(String id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Avancement not found: " + id));
    }

    private ChantierLot resolveLotForEntity(UUID tenantId, AvancementPhysique entity) {
        if (!StringUtils.hasText(entity.getLotId())) {
            return null;
        }
        return lotRepository.findByIdAndTenantId(entity.getLotId(), tenantId).orElse(null);
    }

    private PosteBudgetaire resolvePosteForEntity(UUID tenantId, AvancementPhysique entity) {
        if (!StringUtils.hasText(entity.getPosteId())) {
            return null;
        }
        return posteRepository.findByIdAndTenantId(entity.getPosteId(), tenantId).orElse(null);
    }

    private BigDecimal computeUpdatedCumul(UUID tenantId, AvancementPhysique row) {
        if (!StringUtils.hasText(row.getLotId())) {
            return row.getQuantiteRealisee();
        }
        BigDecimal previous = repository.findByTenantIdAndLotIdOrderByDateSaisieAscCreatedAtAsc(tenantId, row.getLotId())
                .stream()
                .filter(item -> !item.getId().equals(row.getId()))
                .filter(item -> !StringUtils.hasText(row.getPosteId()) || row.getPosteId().equals(item.getPosteId()))
                .map(AvancementPhysique::getQuantiteRealisee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return previous.add(row.getQuantiteRealisee());
    }

    private Map<String, ChantierLot> indexLots(UUID tenantId, String chantierId) {
        Map<String, ChantierLot> lotsById = new HashMap<>();
        for (ChantierLot lot : lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId)) {
            lotsById.put(lot.getId(), lot);
        }
        return lotsById;
    }

    private static void validateEntry(AvancementPhysiqueEntryDto entry) {
        if (!StringUtils.hasText(entry.getLotId()) && !StringUtils.hasText(entry.getPosteId())) {
            throw new IllegalArgumentException("Each entry must reference a lotId or posteId");
        }
        if (entry.getQuantiteRealisee() == null || entry.getQuantiteRealisee().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("quantiteRealisee must be positive");
        }
    }

    private ChantierLot resolveLot(
            UUID tenantId, String chantierId, AvancementPhysiqueEntryDto entry, Map<String, ChantierLot> lotsById) {
        if (!StringUtils.hasText(entry.getLotId())) {
            return null;
        }
        ChantierLot lot = lotsById.get(entry.getLotId().trim());
        if (lot == null) {
            lot = lotRepository
                    .findByIdAndTenantId(entry.getLotId().trim(), tenantId)
                    .filter(item -> chantierId.equals(item.getChantierId()))
                    .orElseThrow(() -> new IllegalArgumentException("Lot not found for chantier: " + entry.getLotId()));
        }
        return lot;
    }

    private PosteBudgetaire resolvePoste(UUID tenantId, AvancementPhysiqueEntryDto entry) {
        if (!StringUtils.hasText(entry.getPosteId())) {
            return null;
        }
        return posteRepository
                .findByIdAndTenantId(entry.getPosteId().trim(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Poste not found: " + entry.getPosteId()));
    }

    private BigDecimal computePreviousCumul(UUID tenantId, String lotId, String posteId) {
        if (!StringUtils.hasText(lotId)) {
            return BigDecimal.ZERO;
        }
        return repository.findByTenantIdAndLotIdOrderByDateSaisieAscCreatedAtAsc(tenantId, lotId).stream()
                .filter(row -> !StringUtils.hasText(posteId) || posteId.equals(row.getPosteId()))
                .map(AvancementPhysique::getQuantiteRealisee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal computeCumulForRow(UUID tenantId, AvancementPhysique row) {
        if (!StringUtils.hasText(row.getLotId())) {
            return row.getQuantiteRealisee();
        }
        return repository.findByTenantIdAndLotIdOrderByDateSaisieAscCreatedAtAsc(tenantId, row.getLotId()).stream()
                .filter(item -> isSameOrBefore(item, row))
                .filter(item -> !StringUtils.hasText(row.getPosteId()) || row.getPosteId().equals(item.getPosteId()))
                .map(AvancementPhysique::getQuantiteRealisee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static boolean isSameOrBefore(AvancementPhysique candidate, AvancementPhysique target) {
        int dateCompare = candidate.getDateSaisie().compareTo(target.getDateSaisie());
        if (dateCompare < 0) {
            return true;
        }
        if (dateCompare > 0) {
            return false;
        }
        return !candidate.getCreatedAt().isAfter(target.getCreatedAt());
    }

    private static BigDecimal computePourcentage(BigDecimal cumul, ChantierLot lot, PosteBudgetaire poste) {
        BigDecimal reference = BigDecimal.ZERO;
        if (poste != null && poste.getQuantite() != null) {
            reference = poste.getQuantite();
        } else if (lot != null && lot.getQuantite() != null) {
            reference = lot.getQuantite();
        }
        if (reference.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal percent = cumul.multiply(ONE_HUNDRED).divide(reference, 4, RoundingMode.HALF_UP);
        return percent.min(ONE_HUNDRED);
    }

    private static AvancementPhysiqueDto toDto(
            AvancementPhysique row, Chantier chantier, ChantierLot lot, BigDecimal cumulQuantite) {
        return AvancementPhysiqueDto.builder()
                .id(row.getId())
                .chantierId(row.getChantierId())
                .chantierCode(chantier.getCode())
                .chantierName(chantier.getLabel())
                .lotId(row.getLotId())
                .lotCode(lot != null ? lot.getCode() : null)
                .lotDesignation(lot != null ? lot.getDesignation() : null)
                .posteId(row.getPosteId())
                .date(row.getDateSaisie())
                .quantiteRealisee(row.getQuantiteRealisee())
                .cumulQuantite(cumulQuantite)
                .pourcentage(row.getPourcentage())
                .saisieParId(row.getSaisieParId())
                .saisieParName(row.getSaisieParName())
                .notes(row.getNotes())
                .status(row.getStatus())
                .photosCount(0)
                .createdAt(row.getCreatedAt())
                .updatedAt(row.getUpdatedAt())
                .build();
    }

    private static String progressKey(String lotId, String posteId) {
        return (lotId != null ? lotId : "") + "::" + (posteId != null ? posteId : "");
    }

    private static String buildId(String chantierId, int index) {
        return chantierId + "-av-" + UUID.randomUUID().toString().substring(0, 8) + "-" + (index + 1);
    }

    private static String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
