package ma.nafura.etudes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.etudes.api.request.ComposantOuvrageInputDto;
import ma.nafura.etudes.api.request.OuvrageCreateDto;
import ma.nafura.etudes.api.request.OuvrageUpdateDto;
import ma.nafura.etudes.api.request.UniteMainInputDto;
import ma.nafura.etudes.domain.model.ComposantOuvrage;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.domain.model.UniteMain;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class OuvrageService {

    private static final BigDecimal DEFAULT_FG = new BigDecimal("8");
    private static final BigDecimal DEFAULT_BENEFICE = new BigDecimal("7");

    private final OuvrageRepository repository;
    private final OuvrageSeedService seedService;
    private final DpuService dpuService;

    public OuvrageService(OuvrageRepository repository, OuvrageSeedService seedService, DpuService dpuService) {
        this.repository = repository;
        this.seedService = seedService;
        this.dpuService = dpuService;
    }

    @Transactional(readOnly = true)
    public Page<Ouvrage> list(
            String category,
            Boolean isActive,
            BigDecimal prixMin,
            BigDecimal prixMax,
            String search,
            String sortBy,
            String sortDirection,
            int page,
            int size) {
        seedService.seedIfEmpty();
        List<Ouvrage> rows = filterRows(category, isActive, prixMin, prixMax, search);
        rows = sortRows(rows, sortBy, sortDirection);
        return paginate(rows, page, size);
    }

    @Transactional(readOnly = true)
    public Ouvrage getById(UUID id) {
        seedService.seedIfEmpty();
        Ouvrage entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Ouvrage not found"));
        attachComposantOuvrageIds(entity);
        dpuService.attachToOuvrage(entity);
        return entity;
    }

    @Transactional
    public Ouvrage create(OuvrageCreateDto request) {
        UUID tenantId = tenantId();
        String code = request.getCode().trim();
        if (repository.existsByTenantIdAndCode(tenantId, code)) {
            throw new IllegalArgumentException("Ouvrage code already exists");
        }
        Ouvrage entity = Ouvrage.builder()
                .tenantId(tenantId)
                .code(code)
                .designation(request.getDesignation().trim())
                .category(request.getCategory().trim())
                .unite(request.getUnite().trim())
                .uniteMain(buildUniteMain(request.getUniteMain()))
                .fraisGenerauxPercent(defaultPercent(request.getFraisGenerauxPercent(), DEFAULT_FG))
                .beneficePercent(defaultPercent(request.getBeneficePercent(), DEFAULT_BENEFICE))
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .notes(trimOrNull(request.getNotes()))
                .composants(new ArrayList<>())
                .build();
        applyComposants(entity, request.getComposants(), tenantId);
        recomputeTotals(entity);
        Ouvrage saved = repository.save(entity);
        attachComposantOuvrageIds(saved);
        return saved;
    }

    @Transactional
    public Ouvrage update(UUID id, OuvrageUpdateDto request) {
        Ouvrage entity = getById(id);
        if (request.getCode() != null) {
            String nextCode = request.getCode().trim();
            if (!nextCode.equals(entity.getCode())
                    && repository.existsByTenantIdAndCode(tenantId(), nextCode)) {
                throw new IllegalArgumentException("Ouvrage code already exists");
            }
            entity.setCode(nextCode);
        }
        if (request.getDesignation() != null) {
            entity.setDesignation(request.getDesignation().trim());
        }
        if (request.getCategory() != null) {
            entity.setCategory(request.getCategory().trim());
        }
        if (request.getUnite() != null) {
            entity.setUnite(request.getUnite().trim());
        }
        if (request.getUniteMain() != null) {
            entity.setUniteMain(buildUniteMain(request.getUniteMain()));
        }
        if (request.getFraisGenerauxPercent() != null) {
            entity.setFraisGenerauxPercent(request.getFraisGenerauxPercent());
        }
        if (request.getBeneficePercent() != null) {
            entity.setBeneficePercent(request.getBeneficePercent());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getComposants() != null) {
            entity.getComposants().clear();
            applyComposants(entity, request.getComposants(), tenantId());
        }
        recomputeTotals(entity);
        entity.setDerniereMaj(LocalDate.now());
        Ouvrage saved = repository.save(entity);
        attachComposantOuvrageIds(saved);
        if (request.getDpuComposants() != null) {
            dpuService.upsertForOuvrage(saved.getId(), request.getDpuComposants(), saved);
        }
        dpuService.attachToOuvrage(saved);
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        Ouvrage entity = getById(id);
        repository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<ma.nafura.etudes.api.dto.OuvrageLookupDto> lookup(String search) {
        seedService.seedIfEmpty();
        List<Ouvrage> rows = filterRows(null, true, null, null, search);
        return rows.stream()
                .map(row -> ma.nafura.etudes.api.dto.OuvrageLookupDto.builder()
                        .id(row.getId().toString())
                        .code(row.getCode())
                        .label(row.getCode() + " — " + row.getDesignation())
                        .category(row.getCategory())
                        .prixUnitaireHt(row.getPrixUnitaireHt())
                        .derniereMaj(row.getDerniereMaj())
                        .build())
                .toList();
    }

    private List<Ouvrage> filterRows(
            String category, Boolean isActive, BigDecimal prixMin, BigDecimal prixMax, String search) {
        UUID tenantId = tenantId();
        List<Ouvrage> rows = repository.findByTenantIdOrderByCodeAsc(tenantId);
        if (StringUtils.hasText(category)) {
            rows = rows.stream()
                    .filter(row -> category.trim().equalsIgnoreCase(row.getCategory()))
                    .toList();
        }
        if (isActive != null) {
            rows = rows.stream().filter(row -> isActive.equals(row.getIsActive())).toList();
        }
        if (prixMin != null) {
            rows = rows.stream()
                    .filter(row -> row.getPrixUnitaireHt().compareTo(prixMin) >= 0)
                    .toList();
        }
        if (prixMax != null) {
            rows = rows.stream()
                    .filter(row -> row.getPrixUnitaireHt().compareTo(prixMax) <= 0)
                    .toList();
        }
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(row -> matchesSearch(row, term)).toList();
        }
        rows.forEach(this::attachComposantOuvrageIds);
        return rows;
    }

    private List<Ouvrage> sortRows(List<Ouvrage> rows, String sortBy, String sortDirection) {
        String field = StringUtils.hasText(sortBy) ? sortBy.trim() : "code";
        boolean desc = "desc".equalsIgnoreCase(sortDirection);
        Comparator<Ouvrage> comparator = switch (field) {
            case "designation" -> Comparator.comparing(Ouvrage::getDesignation, String.CASE_INSENSITIVE_ORDER);
            case "category" -> Comparator.comparing(Ouvrage::getCategory, String.CASE_INSENSITIVE_ORDER);
            case "prixUnitaireHt" -> Comparator.comparing(Ouvrage::getPrixUnitaireHt);
            case "derniereMaj" -> Comparator.comparing(Ouvrage::getDerniereMaj);
            case "isActive" -> Comparator.comparing(Ouvrage::getIsActive);
            default -> Comparator.comparing(Ouvrage::getCode, String.CASE_INSENSITIVE_ORDER);
        };
        if (desc) {
            comparator = comparator.reversed();
        }
        return rows.stream().sorted(comparator).toList();
    }

    private Page<Ouvrage> paginate(List<Ouvrage> rows, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size > 0 ? size : 20;
        int from = Math.min(safePage * safeSize, rows.size());
        int to = Math.min(from + safeSize, rows.size());
        return new PageImpl<>(rows.subList(from, to), PageRequest.of(safePage, safeSize), rows.size());
    }

    private void applyComposants(Ouvrage entity, List<ComposantOuvrageInputDto> inputs, UUID tenantId) {
        if (inputs == null) {
            return;
        }
        for (ComposantOuvrageInputDto input : inputs) {
            BigDecimal total = input.getTotal() != null
                    ? input.getTotal()
                    : input.getRendement().multiply(input.getPrixUnitaire());
            entity.getComposants()
                    .add(ComposantOuvrage.builder()
                            .tenantId(tenantId)
                            .ouvrage(entity)
                            .type(StringUtils.hasText(input.getType())
                                    ? input.getType().trim()
                                    : ComposantOuvrage.TYPE_MATERIAU)
                            .articleId(trimOrNull(input.getArticleId()))
                            .designation(input.getDesignation().trim())
                            .unite(input.getUnite().trim())
                            .rendement(input.getRendement())
                            .prixUnitaire(input.getPrixUnitaire())
                            .total(total.setScale(4, RoundingMode.HALF_UP))
                            .build());
        }
    }

    private UniteMain buildUniteMain(UniteMainInputDto input) {
        if (input == null) {
            return UniteMain.builder()
                    .heures(BigDecimal.ZERO)
                    .tauxHoraire(BigDecimal.ZERO)
                    .total(BigDecimal.ZERO)
                    .build();
        }
        BigDecimal heures = defaultDecimal(input.getHeures());
        BigDecimal taux = defaultDecimal(input.getTauxHoraire());
        BigDecimal total = input.getTotal() != null ? input.getTotal() : heures.multiply(taux);
        return UniteMain.builder()
                .heures(heures)
                .tauxHoraire(taux)
                .total(total.setScale(4, RoundingMode.HALF_UP))
                .build();
    }

    private void recomputeTotals(Ouvrage entity) {
        BigDecimal composantsTotal = entity.getComposants().stream()
                .map(ComposantOuvrage::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal moTotal = entity.getUniteMain() != null && entity.getUniteMain().getTotal() != null
                ? entity.getUniteMain().getTotal()
                : BigDecimal.ZERO;
        BigDecimal sousTotal = composantsTotal.add(moTotal).setScale(4, RoundingMode.HALF_UP);
        BigDecimal fg = defaultPercent(entity.getFraisGenerauxPercent(), DEFAULT_FG);
        BigDecimal benef = defaultPercent(entity.getBeneficePercent(), DEFAULT_BENEFICE);
        BigDecimal prix = sousTotal
                .multiply(BigDecimal.ONE.add(fg.movePointLeft(2)))
                .multiply(BigDecimal.ONE.add(benef.movePointLeft(2)))
                .setScale(2, RoundingMode.HALF_UP);
        entity.setSousTotalDebourse(sousTotal);
        entity.setPrixUnitaireHt(prix);
        entity.setFraisGenerauxPercent(fg);
        entity.setBeneficePercent(benef);
    }

    private void attachComposantOuvrageIds(Ouvrage entity) {
        if (entity.getComposants() == null) {
            return;
        }
        for (ComposantOuvrage composant : entity.getComposants()) {
            composant.setOuvrage(entity);
        }
    }

    private boolean matchesSearch(Ouvrage row, String term) {
        return contains(row.getCode(), term)
                || contains(row.getDesignation(), term)
                || contains(row.getCategory(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private BigDecimal defaultPercent(BigDecimal value, BigDecimal fallback) {
        return value != null ? value : fallback;
    }

    private BigDecimal defaultDecimal(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
