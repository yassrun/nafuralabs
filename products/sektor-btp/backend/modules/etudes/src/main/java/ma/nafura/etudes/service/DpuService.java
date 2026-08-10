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
import ma.nafura.etudes.domain.ComposantReference;
import ma.nafura.etudes.domain.ReferenceType;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.etudes.domain.model.ComposantOuvrage;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.DpuVersion;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.domain.model.PrixDpu;
import ma.nafura.etudes.domain.model.UniteMain;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.DpgfRepository;
import ma.nafura.etudes.repository.DpuVersionRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.item.service.prix.PrixResolu;
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
    private final DossierEtudeRepository dossierEtudeRepository;
    private final DossierIntervenantService intervenantService;
    private final GelPrixComposantService gelPrixService;
    private final OuvrageCompositeService compositeService;
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
            DossierEtudeRepository dossierEtudeRepository,
            DossierIntervenantService intervenantService,
            GelPrixComposantService gelPrixService,
            OuvrageCompositeService compositeService,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.versionRepository = versionRepository;
        this.ouvrageRepository = ouvrageRepository;
        this.noeudRepository = noeudRepository;
        this.dpgfRepository = dpgfRepository;
        this.agregationService = agregationService;
        this.calculator = calculator;
        this.parametresEtudeService = parametresEtudeService;
        this.dossierEtudeRepository = dossierEtudeRepository;
        this.intervenantService = intervenantService;
        this.gelPrixService = gelPrixService;
        this.compositeService = compositeService;
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
        assertOuvrageGraph(entity);
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
        BigDecimal debours = entity.getDeboursSec() != null ? entity.getDeboursSec() : BigDecimal.ZERO;
        BigDecimal fg = entity.getFraisGenerauxPercent();
        noeud.setPrixUnitaire(pu);
        noeud.setCoutUnitaire(debours);
        noeud.setCoutRevient(calculator.computeCoutRevient(debours, fg != null ? fg : noeud.getFraisGenerauxPercent()));
        if (fg != null) {
            noeud.setFraisGenerauxPercent(fg);
        }
        if (entity.getMargeBeneficiairePercent() != null) {
            noeud.setMargePercent(entity.getMargeBeneficiairePercent());
        }
        noeud.setPrixDpuId(entity.getId());
        noeud.setOrigineCout(ma.nafura.etudes.domain.OrigineCout.DECOMPOSE.name());
        noeud.setCoutDeduit(false);
        noeud.setEstimationSaisieEn(null);
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
        dossierEtudeRepository
                .findByTenantIdAndDpgfId(tenantId, dpgfId)
                .ifPresent(dossier -> intervenantService.enregistrerReviseur(dossier.getId()));
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
            mo.setReferenceType(ReferenceType.LIBRE.name());
            mo.setLibelle("Main d'œuvre — " + ouvrage.getDesignation());
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
        input.setReferenceType(composant.getReferenceType());
        input.setItemId(composant.getItemId());
        input.setOuvrageId(composant.getRefOuvrageId());
        input.setLibelle(composant.getLibelle());
        input.setRendement(composant.getRendement());
        input.setUnite(composant.getUnite());
        input.setPrixUnitaire(composant.getPrixUnitaire());
        input.setTotal(composant.getTotal());
        input.setInclureFraisEtMarge(composant.getInclureFraisEtMarge());
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
        assertOuvrageGraph(entity);
    }

    private void assertOuvrageGraph(PrixDpu entity) {
        List<UUID> children = new ArrayList<>();
        for (ComposantDpu composant : entity.getComposants()) {
            if (ReferenceType.OUVRAGE.name().equals(composant.getReferenceType())
                    && composant.getOuvrageId() != null) {
                children.add(composant.getOuvrageId());
            }
        }
        compositeService.assertAcyclic(entity.getOuvrageId(), children);
    }

    private ComposantDpu buildComposant(PrixDpu entity, ComposantDpuInputDto input, int ordre) {
        return buildComposant(entity, input, ordre, false);
    }

    private ComposantDpu buildComposant(
            PrixDpu entity, ComposantDpuInputDto input, int ordre, boolean forceResolve) {
        ComposantReference ref = ComposantReference.resolve(
                input.getReferenceType(),
                input.getItemId(),
                input.getOuvrageId(),
                input.getLibelle(),
                input.getArticleOuPosteId());

        BigDecimal prixUnitaire = input.getPrixUnitaire();
        String sourcePrix = StringUtils.hasText(input.getSourcePrix())
                ? input.getSourcePrix().trim()
                : ma.nafura.item.domain.SourcePrix.MANUEL;
        UUID offreFournisseurId = input.getOffreFournisseurId();

        ComposantDpu.ComposantDpuBuilder builder = ComposantDpu.builder()
                .tenantId(entity.getTenantId())
                .prixDpu(entity)
                .type(input.getType().trim())
                .referenceType(ref.type().name())
                .itemId(ref.itemId())
                .ouvrageId(ref.ouvrageId())
                .libelle(ref.libelle())
                .horsReferentiel(Boolean.TRUE.equals(input.getHorsReferentiel()))
                .inclureFraisEtMarge(Boolean.TRUE.equals(input.getInclureFraisEtMarge()))
                .rendement(input.getRendement())
                .unite(input.getUnite().trim())
                .ordre(ordre)
                .suggereParIa(Boolean.TRUE.equals(input.getSuggereParIa()));

        gelPrixService.copierGelDepuisInput(builder, input);

        if (ref.type() == ReferenceType.ITEM
                && ref.itemId() != null
                && gelPrixService.doitResoudre(input, forceResolve)) {
            PrixResolu resolu = gelPrixService.resoudre(ref.itemId());
            if (resolu != null && resolu.prixUnitaire() != null) {
                gelPrixService.appliquerGel(builder, resolu);
                prixUnitaire = resolu.prixUnitaire();
                sourcePrix = resolu.sourcePrix();
                if (ma.nafura.item.domain.SourcePrix.CONSULTE.equals(resolu.sourcePrix())) {
                    offreFournisseurId = resolu.sourceRefId();
                }
            }
        }

        BigDecimal total = input.getTotal() != null
                ? input.getTotal()
                : calculator.computeLineTotal(input.getRendement(), prixUnitaire);
        return builder
                .prixUnitaire(prixUnitaire)
                .total(total)
                .sourcePrix(sourcePrix)
                .offreFournisseurId(offreFournisseurId)
                .build();
    }

    /**
     * Rafraîchit les prix gelés des composants ITEM d'un DPU.
     * Refusé si le dossier lié n'est plus modifiable (étude validée).
     */
    @Transactional
    public PrixDpu refreshPrices(UUID dpuId) {
        PrixDpu entity = requirePrixDpu(dpuId);
        assertDossierModifiablePourDpu(entity);
        boolean changed = false;
        for (ComposantDpu composant : entity.getComposants()) {
            if (!GelPrixComposantService.isItem(composant.getReferenceType())
                    || composant.getItemId() == null) {
                continue;
            }
            PrixResolu resolu = gelPrixService.resoudre(composant.getItemId());
            if (resolu == null || resolu.prixUnitaire() == null) {
                continue;
            }
            gelPrixService.appliquerGel(composant, resolu);
            changed = true;
        }
        if (changed) {
            applyTotals(entity);
            PrixDpu saved = repository.save(entity);
            syncNoeudFromPrixDpu(saved);
            dossierIdForDpu(saved).ifPresent(intervenantService::enregistrerReviseur);
            return enrichResponse(saved);
        }
        return enrichResponse(entity);
    }

    /**
     * Rafraîchit tous les DPU ITEM du dossier (étude non validée uniquement).
     */
    @Transactional
    public int refreshPricesForDossier(UUID dossierId) {
        var dossier = dossierEtudeRepository
                .findByIdAndTenantId(dossierId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
        if (!dossier.isModifiable()) {
            throw new IllegalStateException("etudes.dossier.verrouille");
        }
        if (dossier.getDpgfId() == null) {
            return 0;
        }
        int count = 0;
        List<DpgfNoeud> noeuds =
                noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dossier.getDpgfId(), tenantId());
        for (DpgfNoeud noeud : noeuds) {
            if (!DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
                continue;
            }
            var dpuOpt = repository.findByDpgfNoeudIdAndTenantId(noeud.getId(), tenantId());
            if (dpuOpt.isEmpty()) {
                continue;
            }
            refreshPrices(dpuOpt.get().getId());
            count++;
        }
        intervenantService.enregistrerReviseur(dossierId);
        return count;
    }

    private void assertDossierModifiablePourDpu(PrixDpu entity) {
        dossierIdForDpu(entity).ifPresent(dossierId -> {
            var dossier = dossierEtudeRepository
                    .findByIdAndTenantId(dossierId, tenantId())
                    .orElse(null);
            if (dossier != null && !dossier.isModifiable()) {
                throw new IllegalStateException("etudes.dossier.verrouille");
            }
        });
    }

    private java.util.Optional<UUID> dossierIdForDpu(PrixDpu entity) {
        if (entity == null || entity.getDpgfNoeudId() == null) {
            return java.util.Optional.empty();
        }
        return noeudRepository
                .findByIdAndTenantId(entity.getDpgfNoeudId(), tenantId())
                .flatMap(noeud -> {
                    UUID dpgfId = noeud.getDpgf() != null ? noeud.getDpgf().getId() : null;
                    if (dpgfId == null) {
                        return java.util.Optional.empty();
                    }
                    return dossierEtudeRepository
                            .findByTenantIdAndDpgfId(tenantId(), dpgfId)
                            .map(d -> d.getId());
                });
    }

    private void applyTotals(PrixDpu entity) {
        resolveOuvrageComposantPrices(entity);
        calculator.recomputeLineTotals(entity.getComposants());
        BigDecimal deboursSec = calculator.computeDeboursSec(entity.getComposants());
        BigDecimal prixVenteHt = calculator.computePrixVenteHt(
                deboursSec, entity.getFraisGenerauxPercent(), entity.getMargeBeneficiairePercent());
        BigDecimal prixVenteTtc = calculator.computePrixVenteTtc(prixVenteHt, entity.getTvaTaux());
        entity.setDeboursSec(deboursSec);
        entity.setPrixVenteHt(prixVenteHt);
        entity.setPrixVenteTtc(prixVenteTtc);
    }

    /** L10 — composant OUVRAGE : prix unitaire = déboursé (ou vente si flag sous-traitance). */
    private void resolveOuvrageComposantPrices(PrixDpu entity) {
        if (entity.getComposants() == null) {
            return;
        }
        for (ComposantDpu composant : entity.getComposants()) {
            if (!ReferenceType.OUVRAGE.name().equals(composant.getReferenceType())
                    || composant.getOuvrageId() == null) {
                continue;
            }
            BigDecimal pu = compositeService.prixUnitaireEffectif(
                    composant.getOuvrageId(),
                    Boolean.TRUE.equals(composant.getInclureFraisEtMarge()),
                    1);
            composant.setPrixUnitaire(pu);
            composant.setTotal(calculator.computeLineTotal(composant.getRendement(), pu));
        }
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
