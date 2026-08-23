package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.etudes.api.dto.DpgfLotTotalDto;
import ma.nafura.etudes.api.dto.PosteOrigineDto;
import ma.nafura.etudes.api.request.DpgfNoeudCreateDto;
import ma.nafura.etudes.api.request.DpgfNoeudUpdateDto;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.service.bordereau.ArticleCodeUniquifier;
import ma.nafura.etudes.domain.dpu.EstimationSaisieEn;
import ma.nafura.etudes.domain.dpu.OrigineCout;
import ma.nafura.etudes.domain.dpgf.Dpgf;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.DpgfRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DpgfService {

    private static final int MONEY_SCALE = 2;

    private final DpgfRepository repository;
    private final DpgfNoeudRepository noeudRepository;
    private final DossierEtudeRepository dossierEtudeRepository;
    private final DpgfAgregationService agregationService;
    private final ParametresEtudeService parametresEtudeService;
    private final DpuCalculator dpuCalculator;
    private final DossierIntervenantService intervenantService;

    public DpgfService(
            DpgfRepository repository,
            DpgfNoeudRepository noeudRepository,
            DossierEtudeRepository dossierEtudeRepository,
            DpgfAgregationService agregationService,
            ParametresEtudeService parametresEtudeService,
            DpuCalculator dpuCalculator,
            DossierIntervenantService intervenantService) {
        this.repository = repository;
        this.noeudRepository = noeudRepository;
        this.dossierEtudeRepository = dossierEtudeRepository;
        this.agregationService = agregationService;
        this.parametresEtudeService = parametresEtudeService;
        this.dpuCalculator = dpuCalculator;
        this.intervenantService = intervenantService;
    }

    @Transactional(readOnly = true)
    public List<Dpgf> list() {
        List<Dpgf> rows = repository.findByTenantIdOrderByCreatedAtDesc(tenantId());
        rows.forEach(d -> d.setHierarchie(List.of()));
        return rows;
    }

    @Transactional(readOnly = true)
    public Dpgf getById(UUID id) {
        Dpgf entity = requireDpgf(id);
        attachArbre(entity);
        return entity;
    }

    @Transactional(readOnly = true)
    public Dpgf getArbre(UUID id) {
        return getById(id);
    }

    @Transactional(readOnly = true)
    public List<DpgfLotTotalDto> getTotauxByLot(UUID id) {
        Dpgf entity = getById(id);
        return agregationService.totauxByLot(entity.getHierarchie());
    }

    /** DPGF vide rattaché au dossier (mode manuel étape 2). */
    @Transactional
    public Dpgf createEmpty(String projetNom, BigDecimal tvaTaux) {
        UUID tenantId = tenantId();
        BigDecimal effectiveTva = tvaTaux != null ? tvaTaux : parametresEtudeService.tvaTauxDefaut();
        Dpgf entity = Dpgf.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .projetNom(projetNom)
                .tvaTaux(effectiveTva)
                .totalHt(BigDecimal.ZERO)
                .totalTva(BigDecimal.ZERO)
                .totalTtc(BigDecimal.ZERO)
                .noeuds(new ArrayList<>())
                .build();
        Dpgf saved = repository.save(entity);
        attachArbre(saved);
        return saved;
    }

    /**
     * Crée un DPGF depuis un arbre extrait d'un bordereau (sans métré amont).
     *
     * <p>Les articles sans unité / quantité positive restent dans l'arbre (marqués incomplets)
     * pour correction manuelle. Ils sont comptés dans {@code articlesIgnores} et le gate
     * bordereau les signale.
     */
    @Transactional
    public ImportResult createFromImport(ImportTreeRequest request, String projetNom, BigDecimal tvaTaux) {
        if (request == null || request.getArbre() == null || request.getArbre().isEmpty()) {
            throw new IllegalArgumentException("etudes.bordereau.arbre_vide");
        }
        UUID tenantId = tenantId();
        BigDecimal effectiveTva = tvaTaux != null ? tvaTaux : parametresEtudeService.tvaTauxDefaut();

        Dpgf entity = Dpgf.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .projetNom(projetNom)
                .tvaTaux(effectiveTva)
                .totalHt(BigDecimal.ZERO)
                .totalTva(BigDecimal.ZERO)
                .totalTtc(BigDecimal.ZERO)
                .noeuds(new ArrayList<>())
                .build();
        Dpgf saved = repository.save(entity);

        ArticleCodeUniquifier.uniquify(request.getArbre());
        ImportPersistStats stats = new ImportPersistStats();
        int ordreRacine = 0;
        for (ImportNoeudDto racine : request.getArbre()) {
            persistImportNoeud(saved, null, racine, ordreRacine++, stats);
        }
        if (stats.articlesAcceptes == 0) {
            throw new IllegalArgumentException("etudes.bordereau.aucun_article_exploitable");
        }

        recalcHeaderTotals(saved.getId());
        attachArbre(saved);
        return new ImportResult(saved, stats.articlesAcceptes, stats.articlesIgnores);
    }

    /** Remplace entièrement les nœuds d'un DPGF existant par un nouvel arbre importé. */
    @Transactional
    public ImportResult remplacerParImport(UUID dpgfId, ImportTreeRequest request) {
        assertStructureEditable(dpgfId);
        Dpgf dpgf = requireDpgf(dpgfId);
        // Native bulk delete: parent_id ON DELETE CASCADE + JPA deleteAll(ordreAsc)
        // would StaleStateException on already-cascaded children (ERP-65).
        noeudRepository.deleteAllByDpgfIdAndTenantId(dpgfId, tenantId());

        ArticleCodeUniquifier.uniquify(request.getArbre());
        ImportPersistStats stats = new ImportPersistStats();
        int ordreRacine = 0;
        for (ImportNoeudDto racine : request.getArbre()) {
            persistImportNoeud(dpgf, null, racine, ordreRacine++, stats);
        }
        if (stats.articlesAcceptes == 0) {
            throw new IllegalArgumentException("etudes.bordereau.aucun_article_exploitable");
        }
        recalcHeaderTotals(dpgfId);
        attachArbre(dpgf);
        return new ImportResult(dpgf, stats.articlesAcceptes, stats.articlesIgnores);
    }

    private void persistImportNoeud(
            Dpgf dpgf, UUID parentId, ImportNoeudDto dto, int ordre, ImportPersistStats stats) {
        if (dto == null) {
            return;
        }
        String type = normalizeImportType(dto.getType());
        String libelle = StringUtils.hasText(dto.getLibelle()) ? dto.getLibelle().trim() : "Sans libellÃ©";
        String code = StringUtils.hasText(dto.getCode()) ? dto.getCode().trim() : String.valueOf(ordre + 1);

        boolean articleIncomplet =
                DpgfNoeud.TYPE_ARTICLE.equals(type) && !articleExploitable(dto);
        if (articleIncomplet) {
            stats.articlesIgnores++;
        }

        DpgfNoeud noeud = DpgfNoeud.builder()
                .tenantId(dpgf.getTenantId())
                .dpgf(dpgf)
                .parentId(parentId)
                .type(type)
                .code(code)
                .libelle(libelle)
                .quantite(dto.getQuantite())
                .unite(trimOrNull(dto.getUnite()))
                .descriptif(trimOrNull(dto.getDescriptif()))
                // Structure only — ignore prices from the source bordereau.
                // Pricing / origine belong to chiffrage (ERP-66: no ESTIME stamp without price).
                .prixUnitaire(null)
                .coutUnitaire(null)
                .total(null)
                .origineCout(null)
                .coutDeduit(false)
                .ordre(dto.getOrdre() != null ? dto.getOrdre() : ordre)
                .build();
        DpgfNoeud saved = noeudRepository.save(noeud);
        if (DpgfNoeud.TYPE_ARTICLE.equals(type) && !articleIncomplet) {
            stats.articlesAcceptes++;
        }

        if (dto.getEnfants() != null) {
            int childOrdre = 0;
            for (ImportNoeudDto enfant : dto.getEnfants()) {
                persistImportNoeud(dpgf, saved.getId(), enfant, childOrdre++, stats);
            }
        }
    }

    /** MÃªme rÃ¨gle que le gate bordereau / l'UI d'extraction. */
    public static boolean articleExploitable(ImportNoeudDto dto) {
        if (dto == null) {
            return false;
        }
        if (dto.getUnite() == null || dto.getUnite().isBlank()) {
            return false;
        }
        return dto.getQuantite() != null && dto.getQuantite().compareTo(BigDecimal.ZERO) > 0;
    }

    /** Compteurs d'import pendant la persistance. */
    public static final class ImportPersistStats {
        public int articlesAcceptes;
        public int articlesIgnores;
    }

    /** RÃ©sultat d'un import (crÃ©ation ou remplacement). */
    public record ImportResult(Dpgf dpgf, int articlesAcceptes, int articlesIgnores) {}

    private static String normalizeImportType(String type) {
        if (!StringUtils.hasText(type)) {
            return DpgfNoeud.TYPE_ARTICLE;
        }
        String n = type.trim().toUpperCase(Locale.ROOT);
        if (DpgfNoeud.TYPE_LOT.equals(n)
                || DpgfNoeud.TYPE_SOUS_LOT.equals(n)
                || DpgfNoeud.TYPE_ARTICLE.equals(n)) {
            return n;
        }
        return DpgfNoeud.TYPE_ARTICLE;
    }

    @Transactional
    public DpgfNoeud addNoeud(UUID dpgfId, DpgfNoeudCreateDto request) {
        assertStructureEditable(dpgfId);
        Dpgf dpgf = requireDpgf(dpgfId);
        UUID tenantId = tenantId();
        UUID parentId = parseUuidOrNull(request.getParentId());

        if (parentId != null) {
            DpgfNoeud parent = noeudRepository
                    .findByIdAndTenantId(parentId, tenantId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent noeud not found"));
            if (!parent.getDpgf().getId().equals(dpgfId)) {
                throw new IllegalArgumentException("Parent noeud does not belong to this DPGF");
            }
        }

        String type = normalizeType(request.getType());
        validateTypeParent(type, parentId);

        DpgfNoeud noeud = DpgfNoeud.builder()
                .tenantId(tenantId)
                .dpgf(dpgf)
                .parentId(parentId)
                .type(type)
                .code(request.getCode().trim())
                .libelle(request.getLibelle().trim())
                .articleId(parseUuidOrNull(request.getArticleId()))
                .quantite(request.getQuantite())
                .unite(trimOrNull(request.getUnite()))
                .prixUnitaire(request.getPrixUnitaire())
                .coutUnitaire(request.getCoutUnitaire())
                .fraisGenerauxPercent(request.getFraisGenerauxPercent())
                .margePercent(request.getMargePercent())
                .descriptif(trimOrNull(request.getDescriptif()))
                .origineCout(DpgfNoeud.TYPE_ARTICLE.equals(type) && StringUtils.hasText(request.getOrigineCout())
                        ? resolveOrigine(request.getOrigineCout(), OrigineCout.ESTIME).name()
                        : null)
                .estimationSaisieEn(request.getEstimationSaisieEn())
                .forfaitPartnerId(request.getForfaitPartnerId())
                .forfaitOffreId(request.getForfaitOffreId())
                .coutDeduit(false)
                .ordre(request.getOrdre() != null ? request.getOrdre() : nextOrdre(dpgfId, parentId, tenantId))
                .build();

        if (DpgfNoeud.TYPE_ARTICLE.equals(type)) {
            applyCoutLigne(noeud, request.getPrixUnitaire());
        }
        noeud.setTotal(computeArticleTotal(type, noeud.getQuantite(), noeud.getPrixUnitaire(), request.getTotal()));

        DpgfNoeud saved = noeudRepository.save(noeud);
        recalcHeaderTotals(dpgfId);
        return saved;
    }

    @Transactional
    public DpgfNoeud updateNoeud(UUID noeudId, DpgfNoeudUpdateDto request) {
        UUID tenantId = tenantId();
        DpgfNoeud noeud = noeudRepository
                .findByIdAndTenantId(noeudId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("DPGF noeud not found"));

        boolean structureChange = request.getCode() != null
                || request.getLibelle() != null
                || request.getQuantite() != null
                || request.getUnite() != null
                || request.getOrdre() != null
                || request.getArticleId() != null;
        if (structureChange) {
            assertStructureEditable(noeud.getDpgf().getId());
        } else {
            assertDossierEditable(noeud.getDpgf().getId());
        }

        if (request.getCode() != null) {
            noeud.setCode(request.getCode().trim());
        }
        if (request.getLibelle() != null) {
            noeud.setLibelle(request.getLibelle().trim());
        }
        if (request.getArticleId() != null) {
            noeud.setArticleId(parseUuidOrNull(request.getArticleId()));
        }
        if (request.getQuantite() != null) {
            noeud.setQuantite(request.getQuantite());
        }
        if (request.getUnite() != null) {
            noeud.setUnite(trimOrNull(request.getUnite()));
        }
        if (request.getFraisGenerauxPercent() != null) {
            noeud.setFraisGenerauxPercent(request.getFraisGenerauxPercent());
        }
        if (request.getMargePercent() != null) {
            noeud.setMargePercent(request.getMargePercent());
        }
        if (request.getDescriptif() != null) {
            noeud.setDescriptif(trimOrNull(request.getDescriptif()));
        }
        if (request.getForfaitPartnerId() != null) {
            noeud.setForfaitPartnerId(request.getForfaitPartnerId());
        }
        if (request.getForfaitOffreId() != null) {
            noeud.setForfaitOffreId(request.getForfaitOffreId());
        }
        if (request.getOrigineCout() != null && DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
            noeud.setOrigineCout(resolveOrigine(request.getOrigineCout(), null).name());
        }
        if (request.getEstimationSaisieEn() != null) {
            noeud.setEstimationSaisieEn(EstimationSaisieEn.from(request.getEstimationSaisieEn()).name());
        }
        if (request.getCoutUnitaire() != null) {
            noeud.setCoutUnitaire(request.getCoutUnitaire());
        }
        if (request.getPrixUnitaire() != null) {
            noeud.setPrixUnitaire(request.getPrixUnitaire());
        }
        if (request.getOrdre() != null) {
            noeud.setOrdre(request.getOrdre());
        }

        if (DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
            boolean touchedCout = request.getCoutUnitaire() != null
                    || request.getPrixUnitaire() != null
                    || request.getFraisGenerauxPercent() != null
                    || request.getMargePercent() != null
                    || request.getOrigineCout() != null
                    || request.getEstimationSaisieEn() != null;
            if (touchedCout) {
                applyCoutLigne(noeud, request.getPrixUnitaire());
            }
        }

        if (request.getTotal() != null) {
            noeud.setTotal(request.getTotal());
        } else if (DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
            noeud.setTotal(computeArticleTotal(
                    noeud.getType(), noeud.getQuantite(), noeud.getPrixUnitaire(), null));
        }

        DpgfNoeud saved = noeudRepository.save(noeud);
        recalcHeaderTotals(noeud.getDpgf().getId());
        dossierEtudeRepository
                .findByTenantIdAndDpgfId(tenantId, noeud.getDpgf().getId())
                .ifPresent(dossier -> intervenantService.enregistrerReviseur(dossier.getId()));
        return saved;
    }

    private OrigineCout resolveOrigine(String raw, OrigineCout defaultValue) {
        if (raw == null || raw.isBlank()) {
            if (defaultValue == null) {
                throw new IllegalArgumentException("etudes.cout.origine_invalide");
            }
            return defaultValue;
        }
        String n = raw.trim().toUpperCase(Locale.ROOT);
        if ("FOURNI".equals(n)) {
            return OrigineCout.ESTIME;
        }
        try {
            return OrigineCout.valueOf(n);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("etudes.cout.origine_invalide");
        }
    }

    /**
     * Alimente cout_unitaire / cout_revient / prix_unitaire selon l'origine.
     * ESTIME+VENTE : dÃ©duit le coÃ»t (cout_deduit=true). DECOMPOSE : ne recalcule
     * pas le prix (le DPU le pose) â€” met Ã  jour revient si coÃ»t connu.
     */
    private void applyCoutLigne(DpgfNoeud noeud, BigDecimal prixSaisiHint) {
        OrigineCout origine = noeud.origineCoutEnum();
        if (origine == null) {
            origine = OrigineCout.ESTIME;
            noeud.setOrigineCout(origine.name());
        }

        BigDecimal fg = noeud.getFraisGenerauxPercent();
        BigDecimal marge = noeud.getMargePercent();

        if (origine == OrigineCout.DECOMPOSE) {
            noeud.setCoutDeduit(false);
            noeud.setEstimationSaisieEn(null);
            if (noeud.getCoutUnitaire() != null) {
                noeud.setCoutRevient(dpuCalculator.computeCoutRevient(noeud.getCoutUnitaire(), fg));
            }
            return;
        }

        if (origine == OrigineCout.FORFAIT) {
            noeud.setCoutDeduit(false);
            noeud.setEstimationSaisieEn(null);
            BigDecimal cout = noeud.getCoutUnitaire();
            if (cout == null) {
                return;
            }
            noeud.setCoutRevient(dpuCalculator.computeCoutRevient(cout, fg));
            noeud.setPrixUnitaire(dpuCalculator.computePrixVenteDepuisCout(cout, fg, marge));
            return;
        }

        // ESTIME
        EstimationSaisieEn saisie = noeud.estimationSaisieEnEnum();
        if (saisie == null) {
            saisie = EstimationSaisieEn.COUT;
            noeud.setEstimationSaisieEn(saisie.name());
        }

        if (saisie == EstimationSaisieEn.VENTE) {
            BigDecimal prix = prixSaisiHint != null ? prixSaisiHint : noeud.getPrixUnitaire();
            if (prix == null) {
                return;
            }
            BigDecimal cout = dpuCalculator.deduceCoutDepuisPrixVente(prix, fg, marge);
            noeud.setCoutUnitaire(cout);
            noeud.setCoutRevient(dpuCalculator.computeCoutRevient(cout, fg));
            noeud.setPrixUnitaire(dpuCalculator.computePrixVenteDepuisCout(cout, fg, marge));
            noeud.setCoutDeduit(true);
            return;
        }

        BigDecimal cout = noeud.getCoutUnitaire();
        if (cout == null) {
            return;
        }
        noeud.setCoutDeduit(false);
        noeud.setCoutRevient(dpuCalculator.computeCoutRevient(cout, fg));
        noeud.setPrixUnitaire(dpuCalculator.computePrixVenteDepuisCout(cout, fg, marge));
    }

    @Transactional
    public void deleteNoeud(UUID noeudId) {
        UUID tenantId = tenantId();
        DpgfNoeud noeud = noeudRepository
                .findByIdAndTenantId(noeudId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("DPGF noeud not found"));
        UUID dpgfId = noeud.getDpgf().getId();
        assertStructureEditable(dpgfId);
        deleteDescendants(noeudId, tenantId);
        noeudRepository.delete(noeud);
        recalcHeaderTotals(dpgfId);
    }

    /** Structure figÃ©e dÃ¨s l'entrÃ©e en dÃ©composition / chiffrage. */
    private void assertStructureEditable(UUID dpgfId) {
        dossierEtudeRepository
                .findByTenantIdAndDpgfId(tenantId(), dpgfId)
                .ifPresent(dossier -> {
                    if (dossier.isStructureVerrouillee()) {
                        throw new IllegalStateException("etudes.bordereau.structure_verrouillee");
                    }
                });
    }

    private void assertDossierEditable(UUID dpgfId) {
        dossierEtudeRepository
                .findByTenantIdAndDpgfId(tenantId(), dpgfId)
                .ifPresent(dossier -> {
                    if (!dossier.isModifiable()) {
                        throw new IllegalStateException("etudes.dossier.verrouille");
                    }
                });
    }

    private void deleteDescendants(UUID parentId, UUID tenantId) {
        List<DpgfNoeud> children = noeudRepository.findByParentIdAndTenantIdOrderByOrdreAsc(parentId, tenantId);
        for (DpgfNoeud child : children) {
            deleteDescendants(child.getId(), tenantId);
            noeudRepository.delete(child);
        }
    }

    private void attachArbre(Dpgf entity) {
        List<DpgfNoeud> flat = noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(entity.getId(), tenantId());
        entity.setHierarchie(buildTree(flat));
    }

    List<DpgfNoeud> buildTree(List<DpgfNoeud> flat) {
        if (flat == null || flat.isEmpty()) {
            return List.of();
        }
        Map<UUID, DpgfNoeud> byId = flat.stream()
                .collect(Collectors.toMap(DpgfNoeud::getId, n -> n, (a, b) -> a, LinkedHashMap::new));
        for (DpgfNoeud node : byId.values()) {
            node.setEnfants(new ArrayList<>());
        }
        List<DpgfNoeud> roots = new ArrayList<>();
        for (DpgfNoeud node : flat) {
            UUID parentId = node.getParentId();
            if (parentId == null) {
                roots.add(node);
            } else {
                DpgfNoeud parent = byId.get(parentId);
                if (parent != null) {
                    parent.getEnfants().add(node);
                } else {
                    roots.add(node);
                }
            }
        }
        sortEnfantsRecursively(roots);
        return roots;
    }

    private void sortEnfantsRecursively(List<DpgfNoeud> nodes) {
        nodes.sort(Comparator.comparingInt(n -> n.getOrdre() != null ? n.getOrdre() : 0));
        for (DpgfNoeud node : nodes) {
            if (node.getEnfants() != null && !node.getEnfants().isEmpty()) {
                sortEnfantsRecursively(node.getEnfants());
            }
        }
    }

    private void recalcHeaderTotals(UUID dpgfId) {
        Dpgf dpgf = requireDpgf(dpgfId);
        List<DpgfNoeud> flat = noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dpgfId, tenantId());
        List<DpgfNoeud> hierarchie = buildTree(flat);
        agregationService.applyHeaderTotals(dpgf, hierarchie);
        repository.save(dpgf);
    }

    private Dpgf requireDpgf(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("DPGF not found"));
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        String prefix = "DPGF-" + year + "-";
        long count = repository.countByTenantIdAndNumeroStartingWith(tenantId, prefix);
        return prefix + String.format(Locale.ROOT, "%03d", count + 1);
    }

    private int nextOrdre(UUID dpgfId, UUID parentId, UUID tenantId) {
        if (parentId == null) {
            return (int) noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dpgfId, tenantId).stream()
                    .filter(n -> n.getParentId() == null)
                    .count();
        }
        return noeudRepository.findByParentIdAndTenantIdOrderByOrdreAsc(parentId, tenantId).size();
    }

    private void validateTypeParent(String type, UUID parentId) {
        switch (type) {
            case DpgfNoeud.TYPE_LOT -> {
                if (parentId != null) {
                    throw new IllegalArgumentException("LOT nodes cannot have a parent");
                }
            }
            case DpgfNoeud.TYPE_SOUS_LOT -> {
                if (parentId == null) {
                    throw new IllegalArgumentException("SOUS_LOT nodes require a LOT parent");
                }
            }
            case DpgfNoeud.TYPE_ARTICLE -> {
                if (parentId == null) {
                    throw new IllegalArgumentException("ARTICLE nodes require a SOUS_LOT parent");
                }
            }
            default -> throw new IllegalArgumentException("Invalid noeud type: " + type);
        }
    }

    private String normalizeType(String type) {
        if (!StringUtils.hasText(type)) {
            throw new IllegalArgumentException("type is required");
        }
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        if (!DpgfNoeud.TYPE_LOT.equals(normalized)
                && !DpgfNoeud.TYPE_SOUS_LOT.equals(normalized)
                && !DpgfNoeud.TYPE_ARTICLE.equals(normalized)) {
            throw new IllegalArgumentException("Invalid noeud type: " + type);
        }
        return normalized;
    }

    private BigDecimal computeArticleTotal(
            String type, BigDecimal quantite, BigDecimal prixUnitaire, BigDecimal explicitTotal) {
        if (!DpgfNoeud.TYPE_ARTICLE.equals(type)) {
            return explicitTotal;
        }
        if (explicitTotal != null) {
            return explicitTotal.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        BigDecimal q = quantite != null ? quantite : BigDecimal.ZERO;
        BigDecimal pu = prixUnitaire != null ? prixUnitaire : BigDecimal.ZERO;
        return q.multiply(pu).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private UUID parseUuidOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return UUID.fromString(value.trim());
    }

    private String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    /**
     * AC-2 / AC-16 — remonter d'une ligne vendue du chantier au poste du devis dont elle a été
     * copiée. La ligne ne conserve que l'identifiant du nœud DPGF ; c'est ici qu'on retrouve le
     * bordereau, puis l'étude à ouvrir.
     */
    @Transactional(readOnly = true)
    public PosteOrigineDto origineDuPoste(UUID noeudId) {
        UUID tenantId = tenantId();
        DpgfNoeud noeud = noeudRepository
                .findByIdAndTenantId(noeudId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.dpgf.noeud_introuvable"));
        UUID dpgfId = noeud.getDpgf() != null ? noeud.getDpgf().getId() : null;
        PosteOrigineDto.PosteOrigineDtoBuilder out = PosteOrigineDto.builder()
                .posteId(noeud.getId())
                .code(noeud.getCode())
                .libelle(noeud.getLibelle())
                .type(noeud.getType())
                .dpgfId(dpgfId);
        if (dpgfId != null) {
            dossierEtudeRepository
                    .findByTenantIdAndDpgfId(tenantId, dpgfId)
                    .ifPresent(dossier -> out.dossierId(dossier.getId())
                            .dossierNumero(dossier.getNumero())
                            .dossierObjet(dossier.getObjet()));
        }
        return out.build();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
