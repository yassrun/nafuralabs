package ma.nafura.etudes.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DpuHistoriqueEntryDto;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.api.request.PrixDpuCreateDto;
import ma.nafura.etudes.api.request.PrixDpuUpdateDto;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.etudes.domain.model.ComposantOuvrage;
import ma.nafura.etudes.domain.model.DpuVersion;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.domain.model.PrixDpu;
import ma.nafura.etudes.domain.model.UniteMain;
import ma.nafura.etudes.repository.DpuVersionRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DpuService {

    private static final BigDecimal DEFAULT_FG = new BigDecimal("8");
    private static final BigDecimal DEFAULT_MARGE = new BigDecimal("7");
    private static final BigDecimal DEFAULT_TVA = new BigDecimal("20");

    private final PrixDpuRepository repository;
    private final DpuVersionRepository versionRepository;
    private final OuvrageRepository ouvrageRepository;
    private final DpuCalculator calculator;
    private final ObjectMapper objectMapper;

    public DpuService(
            PrixDpuRepository repository,
            DpuVersionRepository versionRepository,
            OuvrageRepository ouvrageRepository,
            DpuCalculator calculator,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.versionRepository = versionRepository;
        this.ouvrageRepository = ouvrageRepository;
        this.calculator = calculator;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<PrixDpu> list(UUID ouvrageId) {
        UUID tenantId = tenantId();
        if (ouvrageId != null) {
            return repository.findByTenantIdAndOuvrageIdOrderByUpdatedAtDesc(tenantId, ouvrageId).stream()
                    .map(this::enrichResponse)
                    .toList();
        }
        return repository.findAll().stream()
                .filter(row -> tenantId.equals(row.getTenantId()))
                .map(this::enrichResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PrixDpu getById(UUID id) {
        return enrichResponse(requirePrixDpu(id));
    }

    @Transactional(readOnly = true)
    public PrixDpu findByOuvrageId(UUID ouvrageId) {
        return repository
                .findByOuvrageIdAndTenantId(ouvrageId, tenantId())
                .map(this::enrichResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ComposantDpu> getComposants(UUID prixDpuId) {
        PrixDpu entity = requirePrixDpu(prixDpuId);
        attachComposantLinks(entity);
        return entity.getComposants();
    }

    @Transactional(readOnly = true)
    public List<DpuHistoriqueEntryDto> getHistorique(UUID prixDpuId) {
        requirePrixDpu(prixDpuId);
        return versionRepository
                .findByPrixDpuIdAndTenantIdOrderBySavedAtDesc(prixDpuId, tenantId())
                .stream()
                .map(this::toHistoriqueEntry)
                .toList();
    }

    @Transactional
    public PrixDpu create(PrixDpuCreateDto request) {
        UUID tenantId = tenantId();
        UUID ouvrageId = request.getOuvrageId();
        requireOuvrage(ouvrageId, tenantId);
        if (repository.findByOuvrageIdAndTenantId(ouvrageId, tenantId).isPresent()) {
            throw new IllegalArgumentException("DPU already exists for ouvrage");
        }

        Ouvrage ouvrage = requireOuvrage(ouvrageId, tenantId);
        PrixDpu entity = PrixDpu.builder()
                .tenantId(tenantId)
                .ouvrageId(ouvrageId)
                .fraisGenerauxPercent(defaultPercent(request.getFraisGenerauxPercent(), ouvrage.getFraisGenerauxPercent()))
                .margeBeneficiairePercent(
                        defaultPercent(request.getMargeBeneficiairePercent(), ouvrage.getBeneficePercent()))
                .tvaTaux(defaultPercent(request.getTvaTaux(), DEFAULT_TVA))
                .composants(new ArrayList<>())
                .build();

        importFromOuvrageDetail(entity, ouvrage);
        applyTotals(entity);
        PrixDpu saved = repository.save(entity);
        return enrichResponse(saved);
    }

    @Transactional
    public PrixDpu update(UUID id, PrixDpuUpdateDto request) {
        PrixDpu entity = requirePrixDpu(id);
        if (request.getFraisGenerauxPercent() != null) {
            entity.setFraisGenerauxPercent(request.getFraisGenerauxPercent());
        }
        if (request.getMargeBeneficiairePercent() != null) {
            entity.setMargeBeneficiairePercent(request.getMargeBeneficiairePercent());
        }
        if (request.getTvaTaux() != null) {
            entity.setTvaTaux(request.getTvaTaux());
        }
        if (request.getComposants() != null) {
            replaceComposants(entity, request.getComposants());
        }
        applyTotals(entity);
        return enrichResponse(repository.save(entity));
    }

    @Transactional
    public ComposantDpu addComposant(UUID prixDpuId, ComposantDpuInputDto input) {
        PrixDpu entity = requirePrixDpu(prixDpuId);
        ComposantDpu line = buildComposant(entity, input, entity.getComposants().size());
        entity.getComposants().add(line);
        applyTotals(entity);
        repository.save(entity);
        return line;
    }

    @Transactional
    public PrixDpu recompute(UUID id) {
        PrixDpu entity = requirePrixDpu(id);
        calculator.recomputeLineTotals(entity.getComposants());
        applyTotals(entity);
        return enrichResponse(repository.save(entity));
    }

    @Transactional
    public DpuHistoriqueEntryDto createVersion(UUID id) {
        PrixDpu entity = requirePrixDpu(id);
        attachComposantLinks(entity);
        calculator.recomputeLineTotals(entity.getComposants());
        applyTotals(entity);
        repository.save(entity);

        String snapshotJson = writeSnapshot(entity.getComposants());
        DpuVersion version = DpuVersion.builder()
                .tenantId(entity.getTenantId())
                .prixDpuId(entity.getId())
                .savedAt(java.time.OffsetDateTime.now())
                .fraisGenerauxPercent(entity.getFraisGenerauxPercent())
                .margePercent(entity.getMargeBeneficiairePercent())
                .prixVenteHt(entity.getPrixVenteHt())
                .snapshotJson(snapshotJson)
                .build();
        DpuVersion saved = versionRepository.save(version);
        return toHistoriqueEntry(saved);
    }

    @Transactional
    public PrixDpu upsertForOuvrage(UUID ouvrageId, List<ComposantDpuInputDto> composants, Ouvrage ouvrage) {
        UUID tenantId = tenantId();
        PrixDpu entity = repository
                .findByOuvrageIdAndTenantId(ouvrageId, tenantId)
                .orElseGet(() -> PrixDpu.builder()
                        .tenantId(tenantId)
                        .ouvrageId(ouvrageId)
                        .fraisGenerauxPercent(defaultPercent(null, ouvrage.getFraisGenerauxPercent()))
                        .margeBeneficiairePercent(defaultPercent(null, ouvrage.getBeneficePercent()))
                        .tvaTaux(DEFAULT_TVA)
                        .composants(new ArrayList<>())
                        .build());

        entity.setFraisGenerauxPercent(defaultPercent(ouvrage.getFraisGenerauxPercent(), DEFAULT_FG));
        entity.setMargeBeneficiairePercent(defaultPercent(ouvrage.getBeneficePercent(), DEFAULT_MARGE));

        if (composants != null) {
            replaceComposants(entity, composants);
        } else if (entity.getComposants().isEmpty()) {
            importFromOuvrageDetail(entity, ouvrage);
        }

        applyTotals(entity);
        return repository.save(entity);
    }

    @Transactional(readOnly = true)
    public void attachToOuvrage(Ouvrage ouvrage) {
        PrixDpu dpu = findByOuvrageId(ouvrage.getId());
        if (dpu == null) {
            ouvrage.setDpuComposants(List.of());
            ouvrage.setDpuHistorique(List.of());
            return;
        }
        ouvrage.setDpuComposants(dpu.getComposants());
        ouvrage.setDpuId(dpu.getId());
        ouvrage.setDpuHistorique(
                versionRepository.findByPrixDpuIdAndTenantIdOrderBySavedAtDesc(dpu.getId(), tenantId()).stream()
                        .map(this::toHistoriqueEntry)
                        .toList());
    }

    private PrixDpu enrichResponse(PrixDpu entity) {
        attachComposantLinks(entity);
        Ouvrage ouvrage = ouvrageRepository
                .findByIdAndTenantId(entity.getOuvrageId(), entity.getTenantId())
                .orElse(null);
        if (ouvrage != null) {
            entity.setUnite(ouvrage.getUnite());
        }
        return entity;
    }

    private void importFromOuvrageDetail(PrixDpu entity, Ouvrage ouvrage) {
        List<ComposantDpuInputDto> inputs = new ArrayList<>();
        if (ouvrage.getComposants() != null) {
            for (ComposantOuvrage composant : ouvrage.getComposants()) {
                inputs.add(toInputFromOuvrageComposant(composant));
            }
        }
        UniteMain uniteMain = ouvrage.getUniteMain();
        if (uniteMain != null) {
            ComposantDpuInputDto mo = new ComposantDpuInputDto();
            mo.setType(ComposantDpu.TYPE_MAIN_DOEUVRE);
            mo.setArticleOuPosteId(ouvrage.getId() + "-mo");
            mo.setQuantite(uniteMain.getHeures() != null ? uniteMain.getHeures() : BigDecimal.ZERO);
            mo.setUnite("h");
            mo.setPrixUnitaire(uniteMain.getTauxHoraire() != null ? uniteMain.getTauxHoraire() : BigDecimal.ZERO);
            mo.setTotal(uniteMain.getTotal());
            inputs.add(mo);
        }
        replaceComposants(entity, inputs);
    }

    private ComposantDpuInputDto toInputFromOuvrageComposant(ComposantOuvrage composant) {
        ComposantDpuInputDto input = new ComposantDpuInputDto();
        input.setType(mapOuvrageTypeToDpu(composant.getType()));
        input.setArticleOuPosteId(
                StringUtils.hasText(composant.getArticleId()) ? composant.getArticleId() : composant.getId().toString());
        input.setQuantite(composant.getRendement());
        input.setUnite(composant.getUnite());
        input.setPrixUnitaire(composant.getPrixUnitaire());
        input.setTotal(composant.getTotal());
        return input;
    }

    private String mapOuvrageTypeToDpu(String type) {
        if (!StringUtils.hasText(type)) {
            return ComposantDpu.TYPE_MATIERE;
        }
        return switch (type.trim().toUpperCase()) {
            case ComposantOuvrage.TYPE_MO -> ComposantDpu.TYPE_MAIN_DOEUVRE;
            case ComposantOuvrage.TYPE_LOCATION, ComposantOuvrage.TYPE_OUTILLAGE -> ComposantDpu.TYPE_MATERIEL;
            case ComposantOuvrage.TYPE_SOUS_TRAITANCE -> ComposantDpu.TYPE_SOUS_TRAITANCE;
            default -> ComposantDpu.TYPE_MATIERE;
        };
    }

    private void replaceComposants(PrixDpu entity, List<ComposantDpuInputDto> inputs) {
        entity.getComposants().clear();
        int ordre = 0;
        for (ComposantDpuInputDto input : inputs) {
            entity.getComposants().add(buildComposant(entity, input, ordre++));
        }
    }

    private ComposantDpu buildComposant(PrixDpu entity, ComposantDpuInputDto input, int ordre) {
        BigDecimal total = input.getTotal() != null
                ? input.getTotal()
                : calculator.computeLineTotal(input.getQuantite(), input.getPrixUnitaire());
        return ComposantDpu.builder()
                .tenantId(entity.getTenantId())
                .prixDpu(entity)
                .type(input.getType().trim())
                .articleOuPosteId(input.getArticleOuPosteId().trim())
                .quantite(input.getQuantite())
                .unite(input.getUnite().trim())
                .prixUnitaire(input.getPrixUnitaire())
                .total(total)
                .ordre(ordre)
                .build();
    }

    private void applyTotals(PrixDpu entity) {
        calculator.recomputeLineTotals(entity.getComposants());
        BigDecimal deboursSec = calculator.computeDeboursSec(entity.getComposants());
        BigDecimal prixVenteHt = calculator.computePrixVenteHt(
                deboursSec, entity.getFraisGenerauxPercent(), entity.getMargeBeneficiairePercent());
        BigDecimal prixVenteTtc = calculator.computePrixVenteTtc(prixVenteHt, entity.getTvaTaux());
        entity.setDeboursSec(deboursSec);
        entity.setPrixVenteHt(prixVenteHt);
        entity.setPrixVenteTtc(prixVenteTtc);
    }

    private void attachComposantLinks(PrixDpu entity) {
        if (entity.getComposants() == null) {
            return;
        }
        for (ComposantDpu composant : entity.getComposants()) {
            composant.setPrixDpu(entity);
        }
    }

    private DpuHistoriqueEntryDto toHistoriqueEntry(DpuVersion version) {
        return new DpuHistoriqueEntryDto(
                version.getId(),
                version.getSavedAt(),
                readSnapshot(version.getSnapshotJson()),
                version.getFraisGenerauxPercent(),
                version.getMargePercent(),
                version.getPrixVenteHt());
    }

    private String writeSnapshot(List<ComposantDpu> composants) {
        try {
            return objectMapper.writeValueAsString(composants);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to serialize DPU snapshot", ex);
        }
    }

    private List<ComposantDpu> readSnapshot(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<ComposantDpu>>() {});
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to deserialize DPU snapshot", ex);
        }
    }

    private PrixDpu requirePrixDpu(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("DPU not found"));
    }

    private Ouvrage requireOuvrage(UUID ouvrageId, UUID tenantId) {
        return ouvrageRepository
                .findByIdAndTenantId(ouvrageId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Ouvrage not found"));
    }

    private BigDecimal defaultPercent(BigDecimal value, BigDecimal fallback) {
        return value != null ? value : (fallback != null ? fallback : BigDecimal.ZERO);
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
