package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.CapitalisationArticleDto;
import ma.nafura.etudes.api.dto.CapitalisationRendementLigneDto;
import ma.nafura.etudes.api.dto.CapitalisationResumeDto;
import ma.nafura.etudes.api.dto.CapitalisationVersementResultDto;
import ma.nafura.etudes.api.request.CapitalisationVerserDto;
import ma.nafura.etudes.api.request.ComposantOuvrageInputDto;
import ma.nafura.etudes.api.request.OuvrageCreateDto;
import ma.nafura.etudes.api.request.OuvrageUpdateDto;
import ma.nafura.etudes.api.request.UniteMainInputDto;
import ma.nafura.etudes.domain.OrigineCout;
import ma.nafura.etudes.domain.OuvrageOrigine;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.etudes.domain.model.ComposantOuvrage;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.domain.model.PrixDpu;
import ma.nafura.etudes.domain.model.StatutDossierEtude;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.catalogue.api.CatalogNatureMapping;
import ma.nafura.catalogue.api.CatalogUsageLot;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * L12 — capitalisation bibliothèque après validation d'étude.
 *
 * <p>Jamais appelé depuis {@code valider()} : proposition explicite seulement.
 */
@Service
public class CapitalisationOuvrageService {

    public static final String STATUT_NOUVEAU = "NOUVEAU";
    public static final String STATUT_COLLISION = "COLLISION";
    public static final String STATUT_DEJA_VERSE = "DEJA_VERSE";

    public static final String DECISION_CREER = "CREER";
    public static final String DECISION_IGNORER = "IGNORER";
    public static final String DECISION_NOUVEAU_CODE = "NOUVEAU_CODE";
    public static final String DECISION_REMPLACER = "REMPLACER";

    private final DossierEtudeRepository dossierRepository;
    private final DpgfNoeudRepository noeudRepository;
    private final PrixDpuRepository prixDpuRepository;
    private final OuvrageRepository ouvrageRepository;
    private final OuvrageService ouvrageService;

    public CapitalisationOuvrageService(
            DossierEtudeRepository dossierRepository,
            DpgfNoeudRepository noeudRepository,
            PrixDpuRepository prixDpuRepository,
            OuvrageRepository ouvrageRepository,
            OuvrageService ouvrageService) {
        this.dossierRepository = dossierRepository;
        this.noeudRepository = noeudRepository;
        this.prixDpuRepository = prixDpuRepository;
        this.ouvrageRepository = ouvrageRepository;
        this.ouvrageService = ouvrageService;
    }

    @Transactional(readOnly = true)
    public CapitalisationResumeDto resume(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        boolean valide = estValidePourCapitalisation(dossier);
        List<CapitalisationArticleDto> articles = buildCandidats(dossier);
        int nouveaux = 0;
        int collisions = 0;
        int deja = 0;
        for (CapitalisationArticleDto a : articles) {
            switch (a.getStatut()) {
                case STATUT_NOUVEAU -> nouveaux++;
                case STATUT_COLLISION -> collisions++;
                case STATUT_DEJA_VERSE -> deja++;
                default -> {
                }
            }
        }
        return CapitalisationResumeDto.builder()
                .totalCandidats(articles.size())
                .nouveaux(nouveaux)
                .collisions(collisions)
                .dejaVerses(deja)
                .dossierValide(valide)
                .articles(articles)
                .build();
    }

    @Transactional
    public CapitalisationVersementResultDto verser(UUID dossierId, CapitalisationVerserDto body) {
        DossierEtude dossier = requireDossierValide(dossierId);
        Map<UUID, CapitalisationArticleDto> byNoeud = new HashMap<>();
        for (CapitalisationArticleDto a : buildCandidats(dossier)) {
            byNoeud.put(a.getNoeudId(), a);
        }

        int crees = 0;
        int remplaces = 0;
        int ignores = 0;
        List<UUID> ouvrageIds = new ArrayList<>();

        for (CapitalisationVerserDto.Selection sel : body.getSelections()) {
            CapitalisationArticleDto candidat = byNoeud.get(sel.getNoeudId());
            if (candidat == null) {
                throw new IllegalArgumentException("etudes.capitalisation.noeud_introuvable");
            }
            if (STATUT_DEJA_VERSE.equals(candidat.getStatut())) {
                ignores++;
                continue;
            }

            String decision = normalizeDecision(sel.getDecision(), candidat.getStatut());
            if (DECISION_IGNORER.equals(decision)) {
                ignores++;
                continue;
            }

            if (STATUT_COLLISION.equals(candidat.getStatut())
                    && DECISION_CREER.equals(decision)) {
                throw new IllegalArgumentException("etudes.capitalisation.collision.decision_requise");
            }

            if (DECISION_NOUVEAU_CODE.equals(decision)) {
                if (!StringUtils.hasText(sel.getCodeOverride())) {
                    throw new IllegalArgumentException("etudes.capitalisation.nouveau_code.required");
                }
                String code = sel.getCodeOverride().trim();
                if (ouvrageRepository.existsByTenantIdAndCode(tenantId(), code)) {
                    throw new IllegalArgumentException("etudes.capitalisation.code_existe");
                }
                Ouvrage created = createFromCandidat(dossier, candidat, code);
                ouvrageIds.add(created.getId());
                crees++;
                continue;
            }

            if (DECISION_REMPLACER.equals(decision)) {
                if (candidat.getOuvrageExistantId() == null) {
                    throw new IllegalArgumentException("etudes.capitalisation.remplacer.sans_collision");
                }
                Ouvrage updated = replaceExisting(dossier, candidat, candidat.getOuvrageExistantId());
                ouvrageIds.add(updated.getId());
                remplaces++;
                continue;
            }

            // CREER sur NOUVEAU
            if (ouvrageRepository.existsByTenantIdAndCode(tenantId(), candidat.getCodePropose())) {
                throw new IllegalArgumentException("etudes.capitalisation.collision.decision_requise");
            }
            Ouvrage created = createFromCandidat(dossier, candidat, candidat.getCodePropose());
            ouvrageIds.add(created.getId());
            crees++;
        }

        return CapitalisationVersementResultDto.builder()
                .crees(crees)
                .remplaces(remplaces)
                .ignores(ignores)
                .ouvrageIds(ouvrageIds)
                .build();
    }

    private List<CapitalisationArticleDto> buildCandidats(DossierEtude dossier) {
        if (dossier.getDpgfId() == null) {
            return List.of();
        }
        UUID tenantId = tenantId();
        Map<String, Ouvrage> versesParCode = new HashMap<>();
        for (Ouvrage o : ouvrageRepository.findByTenantIdAndSourceEtudeId(tenantId, dossier.getId())) {
            versesParCode.put(o.getCode(), o);
        }

        List<CapitalisationArticleDto> out = new ArrayList<>();
        List<DpgfNoeud> noeuds =
                noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dossier.getDpgfId(), tenantId);
        for (DpgfNoeud noeud : noeuds) {
            if (!DpgfNoeud.TYPE_ARTICLE.equals(noeud.getType())) {
                continue;
            }
            if (noeud.origineCoutEnum() != OrigineCout.DECOMPOSE) {
                continue;
            }
            Optional<PrixDpu> dpuOpt =
                    prixDpuRepository.findByDpgfNoeudIdAndTenantId(noeud.getId(), tenantId);
            if (dpuOpt.isEmpty() || dpuOpt.get().getComposants() == null || dpuOpt.get().getComposants().isEmpty()) {
                continue;
            }
            PrixDpu dpu = dpuOpt.get();
            String codePropose = proposeCode(noeud);
            String codeLot = CatalogUsageLot.GROS_OEUVRE;
            String codeFamille = "DIVERS";

            CapitalisationArticleDto.CapitalisationArticleDtoBuilder builder =
                    CapitalisationArticleDto.builder()
                            .noeudId(noeud.getId())
                            .prixDpuId(dpu.getId())
                            .codePropose(codePropose)
                            .designation(noeud.getLibelle())
                            .unite(StringUtils.hasText(noeud.getUnite()) ? noeud.getUnite() : "u")
                            .codeLot(codeLot)
                            .codeFamille(codeFamille)
                            .deboursSec(dpu.getDeboursSec())
                            .nbComposants(dpu.getComposants().size());

            if (versesParCode.containsKey(codePropose)) {
                Ouvrage verse = versesParCode.get(codePropose);
                builder.statut(STATUT_DEJA_VERSE)
                        .ouvrageExistantId(verse.getId())
                        .ouvrageExistantCode(verse.getCode());
            } else {
                Optional<Ouvrage> existing =
                        ouvrageRepository.findByTenantIdAndCode(tenantId, codePropose);
                if (existing.isPresent()) {
                    Ouvrage biblio = existing.get();
                    builder.statut(STATUT_COLLISION)
                            .ouvrageExistantId(biblio.getId())
                            .ouvrageExistantCode(biblio.getCode())
                            .comparaisonRendements(comparerRendements(biblio, dpu));
                } else {
                    builder.statut(STATUT_NOUVEAU);
                }
            }
            out.add(builder.build());
        }
        return out;
    }

    private List<CapitalisationRendementLigneDto> comparerRendements(Ouvrage biblio, PrixDpu dpu) {
        List<CapitalisationRendementLigneDto> lignes = new ArrayList<>();
        List<ComposantOuvrage> bo = biblio.getComposants() != null ? biblio.getComposants() : List.of();
        List<ComposantDpu> et = dpu.getComposants() != null ? dpu.getComposants() : List.of();
        int n = Math.max(bo.size(), et.size());
        for (int i = 0; i < n; i++) {
            ComposantOuvrage b = i < bo.size() ? bo.get(i) : null;
            ComposantDpu e = i < et.size() ? et.get(i) : null;
            String libelle = e != null
                    ? e.getLibelle()
                    : (b != null ? b.getLibelle() : "—");
            String unite = e != null ? e.getUnite() : (b != null ? b.getUnite() : "u");
            lignes.add(CapitalisationRendementLigneDto.builder()
                    .libelle(libelle)
                    .unite(unite)
                    .rendementBiblio(b != null ? b.getRendement() : null)
                    .rendementEtude(e != null ? e.getRendement() : null)
                    .build());
        }
        return lignes;
    }

    private Ouvrage createFromCandidat(DossierEtude dossier, CapitalisationArticleDto candidat, String code) {
        PrixDpu dpu = prixDpuRepository
                .findByIdAndTenantId(candidat.getPrixDpuId(), tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.capitalisation.dpu_introuvable"));
        OuvrageCreateDto dto = new OuvrageCreateDto();
        dto.setCode(code);
        dto.setDesignation(candidat.getDesignation());
        dto.setCodeLot(candidat.getCodeLot());
        dto.setCodeFamille(candidat.getCodeFamille());
        dto.setOrigine(OuvrageOrigine.ETUDE.name());
        dto.setSourceEtudeId(dossier.getId());
        dto.setCatalogCleStable(code);
        dto.setUnite(candidat.getUnite());
        dto.setUniteMain(zeroUniteMain());
        dto.setFraisGenerauxPercent(dpu.getFraisGenerauxPercent());
        dto.setBeneficePercent(dpu.getMargeBeneficiairePercent());
        dto.setComposants(mapComposants(dpu));
        dto.setIsActive(true);
        return ouvrageService.create(dto);
    }

    private Ouvrage replaceExisting(
            DossierEtude dossier, CapitalisationArticleDto candidat, UUID ouvrageId) {
        PrixDpu dpu = prixDpuRepository
                .findByIdAndTenantId(candidat.getPrixDpuId(), tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.capitalisation.dpu_introuvable"));
        OuvrageUpdateDto dto = new OuvrageUpdateDto();
        dto.setDesignation(candidat.getDesignation());
        dto.setCodeLot(candidat.getCodeLot());
        dto.setCodeFamille(candidat.getCodeFamille());
        dto.setOrigine(OuvrageOrigine.ETUDE.name());
        dto.setSourceEtudeId(dossier.getId());
        dto.setCatalogCleStable(candidat.getCodePropose());
        dto.setUnite(candidat.getUnite());
        dto.setUniteMain(zeroUniteMain());
        dto.setFraisGenerauxPercent(dpu.getFraisGenerauxPercent());
        dto.setBeneficePercent(dpu.getMargeBeneficiairePercent());
        dto.setComposants(mapComposants(dpu));
        return ouvrageService.update(ouvrageId, dto);
    }

    private List<ComposantOuvrageInputDto> mapComposants(PrixDpu dpu) {
        List<ComposantOuvrageInputDto> inputs = new ArrayList<>();
        for (ComposantDpu c : dpu.getComposants()) {
            ComposantOuvrageInputDto input = new ComposantOuvrageInputDto();
            input.setType(CatalogNatureMapping.toOuvrageTypeFromDpu(c.getType()));
            input.setReferenceType(c.getReferenceType());
            input.setItemId(c.getItemId());
            input.setRefOuvrageId(c.getOuvrageId());
            input.setLibelle(c.getLibelle());
            input.setUnite(StringUtils.hasText(c.getUnite()) ? c.getUnite() : "u");
            input.setRendement(c.getRendement() != null ? c.getRendement() : BigDecimal.ZERO);
            input.setPrixUnitaire(c.getPrixUnitaire() != null ? c.getPrixUnitaire() : BigDecimal.ZERO);
            input.setTotal(c.getTotal());
            input.setInclureFraisEtMarge(Boolean.TRUE.equals(c.getInclureFraisEtMarge()));
            inputs.add(input);
        }
        return inputs;
    }

    private static UniteMainInputDto zeroUniteMain() {
        UniteMainInputDto mo = new UniteMainInputDto();
        mo.setHeures(BigDecimal.ZERO);
        mo.setTauxHoraire(BigDecimal.ZERO);
        mo.setTotal(BigDecimal.ZERO);
        return mo;
    }

    /** Code métier ADR : {lot}.{famille}.{slug} — slug depuis code ou libellé noeud. */
    String proposeCode(DpgfNoeud noeud) {
        String raw = StringUtils.hasText(noeud.getCode()) ? noeud.getCode() : noeud.getLibelle();
        if (raw != null && raw.contains(".") && raw.length() <= 50) {
            return raw.trim();
        }
        String slug = slugify(raw != null ? raw : "ouvrage");
        return CatalogUsageLot.GROS_OEUVRE + ".DIVERS." + slug;
    }

    static String slugify(String raw) {
        String n = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (n.isBlank()) {
            n = "ouvrage";
        }
        if (n.length() > 40) {
            n = n.substring(0, 40).replaceAll("-+$", "");
        }
        return n;
    }

    private static String normalizeDecision(String raw, String statut) {
        if (!StringUtils.hasText(raw)) {
            return STATUT_COLLISION.equals(statut) ? DECISION_IGNORER : DECISION_CREER;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private DossierEtude requireDossier(UUID dossierId) {
        return dossierRepository
                .findByIdAndTenantId(dossierId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
    }

    private DossierEtude requireDossierValide(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        if (!estValidePourCapitalisation(dossier)) {
            throw new IllegalStateException("etudes.capitalisation.dossier_non_valide");
        }
        return dossier;
    }

    private static boolean estValidePourCapitalisation(DossierEtude dossier) {
        StatutDossierEtude s = dossier.getStatus();
        return s == StatutDossierEtude.VALIDEE || s == StatutDossierEtude.DEVIS_GENERE;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
