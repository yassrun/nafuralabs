package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.etudes.api.dto.DpgfLotTotalDto;
import ma.nafura.etudes.api.request.DpgfNoeudCreateDto;
import ma.nafura.etudes.api.request.DpgfNoeudUpdateDto;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.EstimationSaisieEn;
import ma.nafura.etudes.domain.OrigineCout;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.Metre;
import ma.nafura.etudes.domain.model.MetreLigne;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.DpgfRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
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
    private final MetreService metreService;
    private final OuvrageRepository ouvrageRepository;
    private final DpgfAgregationService agregationService;
    private final ParametresEtudeService parametresEtudeService;
    private final DpuCalculator dpuCalculator;
    private final DossierIntervenantService intervenantService;

    public DpgfService(
            DpgfRepository repository,
            DpgfNoeudRepository noeudRepository,
            DossierEtudeRepository dossierEtudeRepository,
            MetreService metreService,
            OuvrageRepository ouvrageRepository,
            DpgfAgregationService agregationService,
            ParametresEtudeService parametresEtudeService,
            DpuCalculator dpuCalculator,
            DossierIntervenantService intervenantService) {
        this.repository = repository;
        this.noeudRepository = noeudRepository;
        this.dossierEtudeRepository = dossierEtudeRepository;
        this.metreService = metreService;
        this.ouvrageRepository = ouvrageRepository;
        this.agregationService = agregationService;
        this.parametresEtudeService = parametresEtudeService;
        this.dpuCalculator = dpuCalculator;
        this.intervenantService = intervenantService;
    }

    @Transactional(readOnly = true)
    public List<Dpgf> list(UUID metreId) {
        UUID tenantId = tenantId();
        List<Dpgf> rows = metreId != null
                ? repository.findByTenantIdAndMetreIdOrderByCreatedAtDesc(tenantId, metreId)
                : repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
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

    @Transactional
    public Dpgf createFromMetre(UUID metreId, BigDecimal tvaTaux) {
        Metre metre = metreService.getById(metreId);
        if (metre.getLignes() == null || metre.getLignes().isEmpty()) {
            metre.setLignes(new ArrayList<>(metreService.listLignes(metreId)));
        }
        UUID tenantId = tenantId();
        BigDecimal effectiveTva = tvaTaux != null ? tvaTaux : parametresEtudeService.tvaTauxDefaut();

        Dpgf entity = Dpgf.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .metreId(metre.getId())
                .projetNom(metre.getProjetNom())
                .tvaTaux(effectiveTva)
                .totalHt(BigDecimal.ZERO)
                .totalTva(BigDecimal.ZERO)
                .totalTtc(BigDecimal.ZERO)
                .noeuds(new ArrayList<>())
                .build();

        Map<UUID, Ouvrage> ouvragesById = loadOuvrages(metre.getLignes(), tenantId);
        Dpgf saved = repository.save(entity);
        buildAndPersistNoeudsFromMetre(saved, metre, ouvragesById, tenantId);

        attachArbre(saved);
        List<DpgfNoeud> hierarchie = saved.getHierarchie();
        agregationService.applyHeaderTotals(saved, hierarchie);
        saved = repository.save(saved);
        return saved;
    }

    /** DPGF vide rattachÃ© au dossier (mode manuel Ã©tape 2). */
    @Transactional
    public Dpgf createEmpty(String projetNom, BigDecimal tvaTaux) {
        UUID tenantId = tenantId();
        BigDecimal effectiveTva = tvaTaux != null ? tvaTaux : parametresEtudeService.tvaTauxDefaut();
        Dpgf entity = Dpgf.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .metreId(null)
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
     * CrÃ©e un DPGF depuis un arbre extrait d'un bordereau (sans mÃ©trÃ© amont).
     *
     * <p>Les lignes sans unitÃ© / quantitÃ© positive (totaux, titres) sont ignorÃ©es â€” elles
     * bloqueraient le gate bordereau sans Ãªtre chiffrables.
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
                .metreId(null)
                .projetNom(projetNom)
                .tvaTaux(effectiveTva)
                .totalHt(BigDecimal.ZERO)
                .totalTva(BigDecimal.ZERO)
                .totalTtc(BigDecimal.ZERO)
                .noeuds(new ArrayList<>())
                .build();
        Dpgf saved = repository.save(entity);

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

    /** Remplace entiÃ¨rement les nÅ“uds d'un DPGF existant par un nouvel arbre importÃ©. */
    @Transactional
    public ImportResult remplacerParImport(UUID dpgfId, ImportTreeRequest request) {
        assertStructureEditable(dpgfId);
        Dpgf dpgf = requireDpgf(dpgfId);
        List<DpgfNoeud> existants =
                noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dpgfId, tenantId());
        noeudRepository.deleteAll(existants);
        noeudRepository.flush();

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

        if (DpgfNoeud.TYPE_ARTICLE.equals(type) && !articleExploitable(dto)) {
            stats.articlesIgnores++;
            // Les enfants d'un article non exploitable ne sont pas attendus ; on les ignore aussi.
            return;
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
                // Structure only â€” ignore any prices from the source bordereau.
                // Pricing belongs to dÃ©composition / chiffrage.
                .prixUnitaire(null)
                .coutUnitaire(null)
                .total(null)
                .origineCout(DpgfNoeud.TYPE_ARTICLE.equals(type) ? OrigineCout.ESTIME.name() : null)
                .coutDeduit(false)
                .ordre(dto.getOrdre() != null ? dto.getOrdre() : ordre)
                .build();
        DpgfNoeud saved = noeudRepository.save(noeud);
        if (DpgfNoeud.TYPE_ARTICLE.equals(type)) {
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
                .metreLigneId(parseUuidOrNull(request.getMetreLigneId()))
                .quantite(request.getQuantite())
                .unite(trimOrNull(request.getUnite()))
                .prixUnitaire(request.getPrixUnitaire())
                .coutUnitaire(request.getCoutUnitaire())
                .fraisGenerauxPercent(request.getFraisGenerauxPercent())
                .margePercent(request.getMargePercent())
                .descriptif(trimOrNull(request.getDescriptif()))
                .origineCout(DpgfNoeud.TYPE_ARTICLE.equals(type)
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
                || request.getArticleId() != null
                || request.getMetreLigneId() != null;
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
        if (request.getMetreLigneId() != null) {
            noeud.setMetreLigneId(parseUuidOrNull(request.getMetreLigneId()));
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

    private void buildAndPersistNoeudsFromMetre(
            Dpgf dpgf,
            Metre metre,
            Map<UUID, Ouvrage> ouvragesById,
            UUID tenantId) {
        Map<String, Map<String, List<MetreLigne>>> groups = groupLignes(metre.getLignes());
        int lotOrdinal = 0;
        int lotOrder = 0;

        for (Map.Entry<String, Map<String, List<MetreLigne>>> lotEntry : groups.entrySet()) {
            lotOrdinal++;
            lotOrder++;
            String lotKey = lotEntry.getKey();
            Map<String, List<MetreLigne>> sousMap = lotEntry.getValue();
            MetreLigne firstLigne = sousMap.values().iterator().next().get(0);

            DpgfNoeud lot = noeudRepository.save(DpgfNoeud.builder()
                    .tenantId(tenantId)
                    .dpgf(dpgf)
                    .parentId(null)
                    .type(DpgfNoeud.TYPE_LOT)
                    .code(lotKey)
                    .libelle(firstLigne.getLotLibelle() != null ? firstLigne.getLotLibelle() : "Lot " + lotKey)
                    .ordre(lotOrder)
                    .build());

            int sousOrdinal = 0;
            int sousOrder = 0;
            for (Map.Entry<String, List<MetreLigne>> sousEntry : sousMap.entrySet()) {
                sousOrdinal++;
                sousOrder++;
                String sousKey = sousEntry.getKey();
                List<MetreLigne> lignes = sousEntry.getValue();
                MetreLigne firstSous = lignes.get(0);

                DpgfNoeud sousLot = noeudRepository.save(DpgfNoeud.builder()
                        .tenantId(tenantId)
                        .dpgf(dpgf)
                        .parentId(lot.getId())
                        .type(DpgfNoeud.TYPE_SOUS_LOT)
                        .code(sousKey)
                        .libelle(firstSous.getSousLotLibelle() != null
                                ? firstSous.getSousLotLibelle()
                                : "Sous-lot " + sousKey)
                        .ordre(sousOrder)
                        .build());

                int artOrdinal = 0;
                int artOrder = 0;
                for (MetreLigne ligne : lignes) {
                    artOrdinal++;
                    artOrder++;
                    Ouvrage ouv = ligne.getOuvrageRefId() != null
                            ? ouvragesById.get(ligne.getOuvrageRefId())
                            : null;
                    BigDecimal pu = ouv != null && ouv.getPrixUnitaireHt() != null
                            ? ouv.getPrixUnitaireHt()
                            : BigDecimal.ZERO;
                    BigDecimal qte = ligne.getQuantiteCalculee() != null
                            ? ligne.getQuantiteCalculee()
                            : BigDecimal.ZERO;
                    BigDecimal total = qte.multiply(pu).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
                    String code = String.format(
                            Locale.ROOT,
                            "%02d.%02d.%03d",
                            lotOrdinal,
                            sousOrdinal,
                            artOrdinal);

                    String libelle = ligne.getDesignationLibre();
                    if (!StringUtils.hasText(libelle) && ouv != null) {
                        libelle = ouv.getDesignation();
                    }
                    if (!StringUtils.hasText(libelle)) {
                        libelle = "â€”";
                    }

                    noeudRepository.save(DpgfNoeud.builder()
                            .tenantId(tenantId)
                            .dpgf(dpgf)
                            .parentId(sousLot.getId())
                            .type(DpgfNoeud.TYPE_ARTICLE)
                            .code(code)
                            .libelle(libelle)
                            .articleId(ligne.getOuvrageRefId())
                            .metreLigneId(ligne.getId())
                            .quantite(qte)
                            .unite(ligne.getUnite() != null
                                    ? ligne.getUnite()
                                    : (ouv != null ? ouv.getUnite() : "U"))
                            .prixUnitaire(pu)
                            .total(total)
                            .ordre(artOrder)
                            .build());
                }
            }
        }
    }

    private Map<String, Map<String, List<MetreLigne>>> groupLignes(List<MetreLigne> lignes) {
        Map<String, Map<String, List<MetreLigne>>> groups = new TreeMap<>();
        if (lignes == null) {
            return groups;
        }
        for (MetreLigne ligne : lignes) {
            String lot = StringUtils.hasText(ligne.getLotCode()) ? ligne.getLotCode().trim() : "01";
            String sous = StringUtils.hasText(ligne.getSousLotCode()) ? ligne.getSousLotCode().trim() : "01.01";
            groups.computeIfAbsent(lot, k -> new TreeMap<>())
                    .computeIfAbsent(sous, k -> new ArrayList<>())
                    .add(ligne);
        }
        return groups;
    }

    private Map<UUID, Ouvrage> loadOuvrages(List<MetreLigne> lignes, UUID tenantId) {
        if (lignes == null || lignes.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = lignes.stream()
                .map(MetreLigne::getOuvrageRefId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return ouvrageRepository.findAllById(ids).stream()
                .filter(o -> tenantId.equals(o.getTenantId()))
                .collect(Collectors.toMap(Ouvrage::getId, o -> o, (a, b) -> a, HashMap::new));
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

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
