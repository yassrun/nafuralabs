package ma.nafura.etudes.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DpuHistoriqueEntryDto;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.api.request.PrixDpuCreateDto;
import ma.nafura.etudes.api.request.PrixDpuUpdateDto;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.etudes.domain.model.ComposantOuvrage;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.DpuVersion;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.domain.model.PrixDpu;
import ma.nafura.etudes.domain.model.UniteMain;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.DpgfRepository;
import ma.nafura.etudes.repository.DpuVersionRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DpuService {

    private static final int MONEY_SCALE = 2;

    private final PrixDpuRepository repository;
    private final DpuVersionRepository versionRepository;
    private final OuvrageRepository ouvrageRepository;
    private final DpgfNoeudRepository noeudRepository;
    private final DpgfRepository dpgfRepository;
    private final DpgfAgregationService agregationService;
    private final DpuCalculator calculator;
    private final ParametresEtudeService parametresEtudeService;
    private final ObjectMapper objectMapper;

    public DpuService(
            PrixDpuRepository repository,
            DpuVersionRepository versionRepository,
            OuvrageRepository ouvrageRepository,
            DpgfNoeudRepository noeudRepository,
            DpgfRepository dpgfRepository,
            DpgfAgregationService agregationService,
            DpuCalculator calculator,
            ParametresEtudeService parametresEtudeService,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.versionRepository = versionRepository;
        this.ouvrageRepository = ouvrageRepository;
        this.noeudRepository = noeudRepository;
        this.dpgfRepository = dpgfRepository;
        this.agregationService = agregationService;
        this.calculator = calculator;
        this.parametresEtudeService = parametresEtudeService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<PrixDpu> list(UUID ouvrageId, UUID dpgfNoeudId) {
        UUID tenantId = tenantId();
        if (dpgfNoeudId != null) {
            return repository
                    .findByDpgfNoeudIdAndTenantId(dpgfNoeudId, tenantId)
                    .map(this::enrichResponse)
                    .map(List::of)
                    .orElseGet(List::of);
        }
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
    public PrixDpu findByDpgfNoeudId(UUID dpgfNoeudId) {
        return repository
                .findByDpgfNoeudIdAndTenantId(dpgfNoeudId, tenantId())
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
        boolean hasOuvrage = request.getOuvrageId() != null;
        boolean hasNoeud = request.getDpgfNoeudId() != null;
        if (hasOuvrage == hasNoeud) {
            throw new IllegalArgumentException("Exactly one of ouvrageId or dpgfNoeudId is required");
        }
        if (hasNoeud) {
            return createForNoeud(request);
        }
        return createForOuvrage(request);
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
        PrixDpu saved = repository.save(entity);
        syncNoeudFromPrixDpu(saved);
        return enrichResponse(saved);
    }

    @Transactional
    public ComposantDpu addComposant(UUID prixDpuId, ComposantDpuInputDto input) {
        PrixDpu entity = requirePrixDpu(prixDpuId);
        ComposantDpu line = buildComposant(entity, input, entity.getComposants().size());
        entity.getComposants().add(line);
        applyTotals(entity);
        PrixDpu saved = repository.save(entity);
        syncNoeudFromPrixDpu(saved);
        return line;
    }

    @Transactional
    public PrixDpu recompute(UUID id) {
        PrixDpu entity = requirePrixDpu(id);
        calculator.recomputeLineTotals(entity.getComposants());
        applyTotals(entity);
        PrixDpu saved = repository.save(entity);
        syncNoeudFromPrixDpu(saved);
        return enrichResponse(saved);
    }

    @Transactional
    public DpuHistoriqueEntryDto createVersion(UUID id) {
        PrixDpu entity = requirePrixDpu(id);
        attachComposantLinks(entity);
        calculator.recomputeLineTotals(entity.getComposants());
        applyTotals(entity);
        repository.save(entity);
        syncNoeudFromPrixDpu(entity);

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
                        .fraisGenerauxPercent(defaultPercent(
                                ouvrage.getFraisGenerauxPercent(),
                                parametresEtudeService.fraisGenerauxPercentDefaut()))
                        .margeBeneficiairePercent(defaultPercent(
                                ouvrage.getBeneficePercent(), parametresEtudeService.margePercentDefaut()))
                        .tvaTaux(parametresEtudeService.tvaTauxDefaut())
                        .composants(new ArrayList<>())
                        .build());

        entity.setFraisGenerauxPercent(defaultPercent(
                ouvrage.getFraisGenerauxPercent(), parametresEtudeService.fraisGenerauxPercentDefaut()));
        entity.setMargeBeneficiairePercent(
                defaultPercent(ouvrage.getBeneficePercent(), parametresEtudeService.margePercentDefaut()));

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

    private PrixDpu createForOuvrage(PrixDpuCreateDto request) {
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
                .fraisGenerauxPercent(defaultPercent(
                        request.getFraisGenerauxPercent(),
                        defaultPercent(ouvrage.getFraisGenerauxPercent(), parametresEtudeService.fraisGenerauxPercentDefaut())))
                .margeBeneficiairePercent(defaultPercent(
                        request.getMargeBeneficiairePercent(),
                        defaultPercent(ouvrage.getBeneficePercent(), parametresEtudeService.margePercentDefaut())))
                .tvaTaux(defaultPercent(request.getTvaTaux(), parametresEtudeService.tvaTauxDefaut()))
                .composants(new ArrayList<>())
                .build();

        importFromOuvrageDetail(entity, ouvrage);
        applyTotals(entity);
        return enrichResponse(repository.save(entity));
    }

    private PrixDpu createForNoeud(PrixDpuCreateDto request) {
        UUID tenantId = tenantId();
        UUID noeudId = request.getDpgfNoeudId();
        DpgfNoeud noeud = requireArticleNoeud(noeudId, tenantId);
        if (repository.findByDpgfNoeudIdAndTenantId(noeudId, tenantId).isPresent()) {
            throw new IllegalArgumentException("DPU already exists for DPGF noeud");
        }

        PrixDpu entity = PrixDpu.builder()
                .tenantId(tenantId)
                .dpgfNoeudId(noeudId)
                .fraisGenerauxPercent(defaultPercent(
                        request.getFraisGenerauxPercent(), parametresEtudeService.fraisGenerauxPercentDefaut()))
                .margeBeneficiairePercent(defaultPercent(
                        request.getMargeBeneficiairePercent(), parametresEtudeService.margePercentDefaut()))
                .tvaTaux(defaultPercent(request.getTvaTaux(), parametresEtudeService.tvaTauxDefaut()))
                .composants(new ArrayList<>())
                .build();

        applyTotals(entity);
        PrixDpu saved = repository.save(entity);
        syncNoeudFromPrixDpu(saved);
        return enrichResponse(saved);
    }

    private void syncNoeudFromPrixDpu(PrixDpu entity) {
        if (entity.getDpgfNoeudId() == null) {
            return;
        }
        UUID tenantId = entity.getTenantId();
        DpgfNoeud noeud = noeudRepository
                .findByIdAndTenantId(entity.getDpgfNoeudId(), tenantId)
                .orElse(null);
        if (noeud == null || !DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
            return;
        }

        BigDecimal pu = entity.getPrixVenteHt() != null ? entity.getPrixVenteHt() : BigDecimal.ZERO;
        noeud.setPrixUnitaire(pu);
        noeud.setPrixDpuId(entity.getId());
        noeud.setMode(DpgfNoeud.MODE_DECOMPOSE);
        if (noeud.getQuantite() != null) {
            noeud.setTotal(noeud.getQuantite().multiply(pu).setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        } else {
            noeud.setTotal(pu);
        }
        noeudRepository.save(noeud);

        UUID dpgfId = noeud.getDpgf() != null ? noeud.getDpgf().getId() : null;
        if (dpgfId == null) {
            return;
        }
        Dpgf dpgf = dpgfRepository.findByIdAndTenantId(dpgfId, tenantId).orElse(null);
        if (dpgf == null) {
            return;
        }
        List<DpgfNoeud> flat = noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dpgfId, tenantId);
        List<DpgfNoeud> hierarchie = buildFlatTree(flat);
        agregationService.applyHeaderTotals(dpgf, hierarchie);
        dpgfRepository.save(dpgf);
    }

    /** Minimal tree rebuild for header aggregation (same shape as DpgfService.buildTree). */
    private List<DpgfNoeud> buildFlatTree(List<DpgfNoeud> flat) {
        java.util.Map<UUID, DpgfNoeud> byId = new java.util.LinkedHashMap<>();
        for (DpgfNoeud n : flat) {
            n.setEnfants(new ArrayList<>());
            byId.put(n.getId(), n);
        }
        List<DpgfNoeud> roots = new ArrayList<>();
        for (DpgfNoeud n : flat) {
            if (n.getParentId() != null && byId.containsKey(n.getParentId())) {
                byId.get(n.getParentId()).getEnfants().add(n);
            } else {
                roots.add(n);
            }
        }
        return roots;
    }

    private PrixDpu enrichResponse(PrixDpu entity) {
        attachComposantLinks(entity);
        if (entity.getOuvrageId() != null) {
            Ouvrage ouvrage = ouvrageRepository
                    .findByIdAndTenantId(entity.getOuvrageId(), entity.getTenantId())
                    .orElse(null);
            if (ouvrage != null) {
                entity.setUnite(ouvrage.getUnite());
            }
        } else if (entity.getDpgfNoeudId() != null) {
            noeudRepository
                    .findByIdAndTenantId(entity.getDpgfNoeudId(), entity.getTenantId())
                    .ifPresent(noeud -> entity.setUnite(noeud.getUnite()));
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
            mo.setRendement(uniteMain.getHeures() != null ? uniteMain.getHeures() : BigDecimal.ZERO);
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
        input.setRendement(composant.getRendement());
        input.setUnite(composant.getUnite());
        input.setPrixUnitaire(composant.getPrixUnitaire());
        input.setTotal(composant.getTotal());
        return input;
    }

    private String mapOuvrageTypeToDpu(String type) {
        return ma.nafura.item.domain.NatureComposantMapping.toDpuTypeFromOuvrage(type);
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
                : calculator.computeLineTotal(input.getRendement(), input.getPrixUnitaire());
        return ComposantDpu.builder()
                .tenantId(entity.getTenantId())
                .prixDpu(entity)
                .type(input.getType().trim())
                .articleOuPosteId(input.getArticleOuPosteId().trim())
                .rendement(input.getRendement())
                .unite(input.getUnite().trim())
                .prixUnitaire(input.getPrixUnitaire())
                .total(total)
                .ordre(ordre)
                .sourcePrix(StringUtils.hasText(input.getSourcePrix())
                        ? input.getSourcePrix().trim()
                        : ma.nafura.item.domain.SourcePrix.MANUEL)
                .offreFournisseurId(input.getOffreFournisseurId())
                .suggereParIa(Boolean.TRUE.equals(input.getSuggereParIa()))
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

    private DpgfNoeud requireArticleNoeud(UUID noeudId, UUID tenantId) {
        DpgfNoeud noeud = noeudRepository
                .findByIdAndTenantId(noeudId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("DPGF noeud not found"));
        if (!DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
            throw new IllegalArgumentException("DPU can only be attached to an ARTICLE noeud");
        }
        return noeud;
    }

    private BigDecimal defaultPercent(BigDecimal value, BigDecimal fallback) {
        return value != null ? value : (fallback != null ? fallback : BigDecimal.ZERO);
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
