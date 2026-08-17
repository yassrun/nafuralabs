package ma.nafura.etudes.service.guest;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;
import ma.nafura.etudes.api.dto.GuestLinkCreatedDto;
import ma.nafura.etudes.api.dto.GuestSnapshotDto;
import ma.nafura.etudes.api.dto.GuestSnapshotDto.GuestCommentDto;
import ma.nafura.etudes.api.dto.GuestSnapshotDto.GuestComposantDto;
import ma.nafura.etudes.api.dto.GuestSnapshotDto.GuestDpuDto;
import ma.nafura.etudes.api.dto.GuestSnapshotDto.GuestNoeudDto;
import ma.nafura.etudes.api.request.GuestLinkCreateDto;
import ma.nafura.etudes.domain.dossier.DossierDocument;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.GuestAccessLink;
import ma.nafura.etudes.domain.cps.CpsSection;
import ma.nafura.etudes.domain.dpgf.Dpgf;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.domain.dpu.PrixDpu;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.GuestAccessLinkRepository;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.etudes.service.DossierDocumentService;
import ma.nafura.etudes.service.DpgfService;
import ma.nafura.etudes.service.cps.CpsService;
import ma.nafura.platform.collaboration.comment.CommentService;
import ma.nafura.platform.collaboration.comment.domain.model.RecordComment;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class GuestAccessService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int DEFAULT_HOURS = 24;

    private final GuestAccessLinkRepository linkRepository;
    private final DossierEtudeRepository dossierRepository;
    private final DpgfService dpgfService;
    private final PrixDpuRepository prixDpuRepository;
    private final DossierDocumentService documentService;
    private final CommentService commentService;
    private final TenantRepository tenantRepository;
    private final CpsService cpsService;

    public GuestAccessService(
            GuestAccessLinkRepository linkRepository,
            DossierEtudeRepository dossierRepository,
            DpgfService dpgfService,
            PrixDpuRepository prixDpuRepository,
            DossierDocumentService documentService,
            CommentService commentService,
            TenantRepository tenantRepository,
            CpsService cpsService) {
        this.linkRepository = linkRepository;
        this.dossierRepository = dossierRepository;
        this.dpgfService = dpgfService;
        this.prixDpuRepository = prixDpuRepository;
        this.documentService = documentService;
        this.commentService = commentService;
        this.tenantRepository = tenantRepository;
        this.cpsService = cpsService;
    }

    @Transactional
    public GuestLinkCreatedDto create(UUID dossierId, GuestLinkCreateDto request) {
        UUID tenant = TenantContext.getTenantId();
        dossierRepository
                .findByIdAndTenantId(dossierId, tenant)
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
        String email = normalizeEmail(request.getEmail());
        String purpose = normalizePurpose(request.getPurpose());
        String token = newToken();
        GuestAccessLink link = GuestAccessLink.builder()
                .tenantId(tenant)
                .dossierEtudeId(dossierId)
                .email(email)
                .purpose(purpose)
                .tokenHash(hashToken(token))
                .expiresAt(OffsetDateTime.now().plusHours(DEFAULT_HOURS))
                .createdBy(UserContext.getUserEmail())
                .build();
        linkRepository.save(link);
        return GuestLinkCreatedDto.builder()
                .token(token)
                .email(email)
                .purpose(purpose)
                .expiresAt(link.getExpiresAt())
                .build();
    }

    @Transactional
    public GuestSnapshotDto resolve(String rawToken) {
        GuestAccessLink link = requireActive(rawToken);
        return withTenant(link, () -> {
            link.setLastSeenAt(OffsetDateTime.now());
            linkRepository.save(link);
            return buildSnapshot(link);
        });
    }

    @Transactional
    public DossierDocument deposerDevis(String rawToken, MultipartFile file) {
        GuestAccessLink link = requireActive(rawToken);
        if (!GuestAccessLink.PURPOSE_FOURNISSEUR_UPLOAD.equals(link.getPurpose())) {
            throw new GuestLinkPurposeException();
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("etudes.guest.fichier_requis");
        }
        return withTenant(link, () -> {
            link.setLastSeenAt(OffsetDateTime.now());
            linkRepository.save(link);
            return documentService.deposer(link.getDossierEtudeId(), file, DossierDocument.TYPE_DEVIS_FOURNISSEUR);
        });
    }

    static String hashToken(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private GuestAccessLink requireActive(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            throw new GuestLinkInactiveException();
        }
        GuestAccessLink link = linkRepository
                .findByTokenHash(hashToken(rawToken.trim()))
                .orElseThrow(GuestLinkInactiveException::new);
        if (!link.isActive(OffsetDateTime.now())) {
            throw new GuestLinkInactiveException();
        }
        return link;
    }

    private GuestSnapshotDto buildSnapshot(GuestAccessLink link) {
        DossierEtude dossier = dossierRepository
                .findByIdAndTenantId(link.getDossierEtudeId(), link.getTenantId())
                .orElseThrow(GuestLinkInactiveException::new);
        GuestSnapshotDto.GuestSnapshotDtoBuilder builder = GuestSnapshotDto.builder()
                .purpose(link.getPurpose())
                .numero(dossier.getNumero())
                .objet(dossier.getObjet())
                .clientNom(dossier.getClientNom())
                .tenantNom(tenantRepository.findById(link.getTenantId()).map(Tenant::getName).orElse(null))
                .dossierId(dossier.getId() != null ? dossier.getId().toString() : null)
                .dpgfId(dossier.getDpgfId() != null ? dossier.getDpgfId().toString() : null)
                .expiresAt(link.getExpiresAt())
                .arbre(List.of());
        if (!GuestAccessLink.PURPOSE_CLIENT_VIEW.equals(link.getPurpose()) || dossier.getDpgfId() == null) {
            return builder.build();
        }
        Dpgf dpgf = dpgfService.getArbre(dossier.getDpgfId());
        List<DpgfNoeud> roots = dpgf.getHierarchie() != null ? dpgf.getHierarchie() : List.of();
        Map<UUID, PrixDpu> prixByNoeud = loadPrix(collectArticleIds(roots), link.getTenantId());
        Map<String, String> cpsByArticle = loadCpsDescriptifs(dossier.getCpsDocumentId(), roots);
        return builder
                .totalHt(dpgf.getTotalHt())
                .arbre(mapNoeuds(roots, prixByNoeud, cpsByArticle))
                .build();
    }

    private Map<UUID, PrixDpu> loadPrix(Collection<UUID> articleIds, UUID tenantId) {
        if (articleIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, PrixDpu> byNoeud = new LinkedHashMap<>();
        for (PrixDpu prix : prixDpuRepository.findByTenantIdAndDpgfNoeudIdIn(tenantId, articleIds)) {
            if (prix.getDpgfNoeudId() != null) {
                byNoeud.put(prix.getDpgfNoeudId(), prix);
            }
        }
        return byNoeud;
    }

    private static List<UUID> collectArticleIds(List<DpgfNoeud> nodes) {
        List<UUID> ids = new ArrayList<>();
        walkArticles(nodes, ids);
        return ids;
    }

    private static void walkArticles(List<DpgfNoeud> nodes, List<UUID> ids) {
        if (nodes == null) {
            return;
        }
        for (DpgfNoeud node : nodes) {
            if (DpgfNoeud.TYPE_ARTICLE.equalsIgnoreCase(node.getType()) && node.getId() != null) {
                ids.add(node.getId());
            }
            walkArticles(node.getEnfants(), ids);
        }
    }

    private Map<String, String> loadCpsDescriptifs(String cpsDocumentId, List<DpgfNoeud> roots) {
        if (!StringUtils.hasText(cpsDocumentId)) {
            return Map.of();
        }
        UUID cpsId;
        try {
            cpsId = UUID.fromString(cpsDocumentId.trim());
        } catch (IllegalArgumentException ignored) {
            return Map.of();
        }
        Map<String, String> byArticle = new LinkedHashMap<>();
        fillCpsDescriptifs(roots, cpsId, byArticle);
        return byArticle;
    }

    private void fillCpsDescriptifs(List<DpgfNoeud> nodes, UUID cpsId, Map<String, String> out) {
        if (nodes == null) {
            return;
        }
        for (DpgfNoeud node : nodes) {
            if (DpgfNoeud.TYPE_ARTICLE.equalsIgnoreCase(node.getType()) && node.getId() != null) {
                List<CpsSection> found = cpsService.rechercherPourArticle(cpsId, node, 1);
                if (!found.isEmpty() && StringUtils.hasText(found.get(0).getContenu())) {
                    out.put(node.getId().toString(), found.get(0).getContenu());
                }
            }
            fillCpsDescriptifs(node.getEnfants(), cpsId, out);
        }
    }

    private static List<GuestNoeudDto> mapNoeuds(
            List<DpgfNoeud> nodes, Map<UUID, PrixDpu> prixByNoeud, Map<String, String> cpsByArticle) {
        if (nodes == null || nodes.isEmpty()) {
            return List.of();
        }
        List<GuestNoeudDto> out = new ArrayList<>();
        for (DpgfNoeud node : nodes) {
            boolean article = DpgfNoeud.TYPE_ARTICLE.equalsIgnoreCase(node.getType());
            PrixDpu prix = article ? prixByNoeud.get(node.getId()) : null;
            out.add(GuestNoeudDto.builder()
                    .id(node.getId() != null ? node.getId().toString() : null)
                    .type(node.getType())
                    .code(node.getCode())
                    .libelle(node.getLibelle())
                    .unite(node.getUnite())
                    .quantite(node.getQuantite())
                    .prixUnitaire(node.getPrixUnitaire())
                    .coutUnitaire(node.getCoutUnitaire())
                    .fraisGenerauxPercent(
                            node.getFraisGenerauxPercent() != null
                                    ? node.getFraisGenerauxPercent()
                                    : (prix != null ? prix.getFraisGenerauxPercent() : null))
                    .margePercent(
                            node.getMargePercent() != null
                                    ? node.getMargePercent()
                                    : (prix != null ? prix.getMargeBeneficiairePercent() : null))
                    .total(node.getTotal())
                    .origineCout(node.getOrigineCout())
                    .estimationSaisieEn(node.getEstimationSaisieEn())
                    .coutDeduit(node.getCoutDeduit())
                    .descriptif(node.getDescriptif())
                    .descriptifCps(
                            article && node.getId() != null
                                    ? cpsByArticle.get(node.getId().toString())
                                    : null)
                    .prixDpuId(node.getPrixDpuId() != null ? node.getPrixDpuId().toString() : null)
                    .dpu(article ? mapDpu(prix) : null)
                    .composants(article ? mapComposants(prix) : List.of())
                    .enfants(mapNoeuds(node.getEnfants(), prixByNoeud, cpsByArticle))
                    .build());
        }
        return out;
    }

    private static List<GuestComposantDto> mapComposants(PrixDpu prix) {
        if (prix == null || prix.getComposants() == null || prix.getComposants().isEmpty()) {
            return List.of();
        }
        List<GuestComposantDto> out = new ArrayList<>();
        for (ComposantDpu c : prix.getComposants()) {
            out.add(GuestComposantDto.builder()
                    .id(c.getId() != null ? c.getId().toString() : null)
                    .type(c.getType())
                    .designation(c.getLibelle())
                    .unite(c.getUnite())
                    .quantite(c.getRendement())
                    .prixUnitaire(c.getPrixUnitaire())
                    .total(c.getTotal() != null ? c.getTotal() : BigDecimal.ZERO)
                    .build());
        }
        return out;
    }

    private static GuestDpuDto mapDpu(PrixDpu prix) {
        if (prix == null) {
            return null;
        }
        return GuestDpuDto.builder()
                .id(prix.getId() != null ? prix.getId().toString() : null)
                .deboursSec(prix.getDeboursSec())
                .fraisGenerauxPercent(prix.getFraisGenerauxPercent())
                .margeBeneficiairePercent(prix.getMargeBeneficiairePercent())
                .prixVenteHt(prix.getPrixVenteHt())
                .tvaTaux(prix.getTvaTaux())
                .composants(mapComposants(prix))
                .build();
    }

    @Transactional(readOnly = true)
    public List<GuestCommentDto> listComments(String rawToken, UUID noeudId) {
        GuestAccessLink link = requireActive(rawToken);
        if (!GuestAccessLink.PURPOSE_CLIENT_VIEW.equals(link.getPurpose())) {
            throw new GuestLinkPurposeException();
        }
        return withTenant(link, () -> {
            requireNoeudOfDossier(link, noeudId);
            return commentService
                    .listByEntity("dpgf_noeud", noeudId, PageRequest.of(0, 100))
                    .getContent()
                    .stream()
                    .map(GuestAccessService::toCommentDto)
                    .toList();
        });
    }

    @Transactional
    public GuestCommentDto addComment(String rawToken, UUID noeudId, String text) {
        GuestAccessLink link = requireActive(rawToken);
        if (!GuestAccessLink.PURPOSE_CLIENT_VIEW.equals(link.getPurpose())) {
            throw new GuestLinkPurposeException();
        }
        if (!StringUtils.hasText(text)) {
            throw new IllegalArgumentException("etudes.guest.commentaire_requis");
        }
        return withTenant(link, () -> {
            requireNoeudOfDossier(link, noeudId);
            UserContext.setUserEmail(link.getEmail());
            try {
                return toCommentDto(commentService.add("dpgf_noeud", noeudId, text.trim()));
            } finally {
                UserContext.clear();
            }
        });
    }

    private void requireNoeudOfDossier(GuestAccessLink link, UUID noeudId) {
        DossierEtude dossier = dossierRepository
                .findByIdAndTenantId(link.getDossierEtudeId(), link.getTenantId())
                .orElseThrow(GuestLinkInactiveException::new);
        if (dossier.getDpgfId() == null) {
            throw new IllegalArgumentException("etudes.guest.article_introuvable");
        }
        List<DpgfNoeud> roots = dpgfService.getArbre(dossier.getDpgfId()).getHierarchie();
        if (!containsNoeud(roots, noeudId)) {
            throw new IllegalArgumentException("etudes.guest.article_introuvable");
        }
    }

    private static boolean containsNoeud(List<DpgfNoeud> nodes, UUID id) {
        if (nodes == null) {
            return false;
        }
        for (DpgfNoeud node : nodes) {
            if (id.equals(node.getId())) {
                return true;
            }
            if (containsNoeud(node.getEnfants(), id)) {
                return true;
            }
        }
        return false;
    }

    private static GuestCommentDto toCommentDto(RecordComment comment) {
        return GuestCommentDto.builder()
                .id(comment.getId() != null ? comment.getId().toString() : null)
                .author(comment.getAuthor())
                .body(comment.getBody())
                .createdAt(comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null)
                .build();
    }

    private <T> T withTenant(GuestAccessLink link, Supplier<T> action) {
        TenantContext.setTenantId(link.getTenantId());
        try {
            return action.get();
        } finally {
            TenantContext.clear();
        }
    }

    private static String newToken() {
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    }

    private static String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("etudes.guest.email_requis");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizePurpose(String purpose) {
        if (!StringUtils.hasText(purpose)) {
            throw new IllegalArgumentException("etudes.guest.usage_invalide");
        }
        String normalized = purpose.trim().toUpperCase(Locale.ROOT);
        if (!GuestAccessLink.PURPOSE_CLIENT_VIEW.equals(normalized)
                && !GuestAccessLink.PURPOSE_FOURNISSEUR_UPLOAD.equals(normalized)) {
            throw new IllegalArgumentException("etudes.guest.usage_invalide");
        }
        return normalized;
    }
}
