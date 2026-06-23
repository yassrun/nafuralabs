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
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.Metre;
import ma.nafura.etudes.domain.model.MetreLigne;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.DpgfRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DpgfService {

    private static final BigDecimal DEFAULT_TVA = new BigDecimal("20");
    private static final int MONEY_SCALE = 2;

    private final DpgfRepository repository;
    private final DpgfNoeudRepository noeudRepository;
    private final MetreService metreService;
    private final OuvrageRepository ouvrageRepository;
    private final DpgfAgregationService agregationService;

    public DpgfService(
            DpgfRepository repository,
            DpgfNoeudRepository noeudRepository,
            MetreService metreService,
            OuvrageRepository ouvrageRepository,
            DpgfAgregationService agregationService) {
        this.repository = repository;
        this.noeudRepository = noeudRepository;
        this.metreService = metreService;
        this.ouvrageRepository = ouvrageRepository;
        this.agregationService = agregationService;
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
        BigDecimal effectiveTva = tvaTaux != null ? tvaTaux : DEFAULT_TVA;

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

    @Transactional
    public DpgfNoeud addNoeud(UUID dpgfId, DpgfNoeudCreateDto request) {
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
                .total(computeArticleTotal(type, request.getQuantite(), request.getPrixUnitaire(), request.getTotal()))
                .ordre(request.getOrdre() != null ? request.getOrdre() : nextOrdre(dpgfId, parentId, tenantId))
                .build();

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
        if (request.getPrixUnitaire() != null) {
            noeud.setPrixUnitaire(request.getPrixUnitaire());
        }
        if (request.getOrdre() != null) {
            noeud.setOrdre(request.getOrdre());
        }
        if (request.getTotal() != null) {
            noeud.setTotal(request.getTotal());
        } else if (DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
            noeud.setTotal(computeArticleTotal(
                    noeud.getType(), noeud.getQuantite(), noeud.getPrixUnitaire(), noeud.getTotal()));
        }

        DpgfNoeud saved = noeudRepository.save(noeud);
        recalcHeaderTotals(noeud.getDpgf().getId());
        return saved;
    }

    @Transactional
    public void deleteNoeud(UUID noeudId) {
        UUID tenantId = tenantId();
        DpgfNoeud noeud = noeudRepository
                .findByIdAndTenantId(noeudId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("DPGF noeud not found"));
        UUID dpgfId = noeud.getDpgf().getId();
        deleteDescendants(noeudId, tenantId);
        noeudRepository.delete(noeud);
        recalcHeaderTotals(dpgfId);
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
                        libelle = "—";
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
