package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import ma.nafura.etudes.api.dto.CatalogCandidateDto;
import ma.nafura.etudes.api.dto.DecompositionProposeDto;
import ma.nafura.etudes.api.dto.DecompositionProposeDto.ComposantMatchedDto;
import ma.nafura.etudes.api.dto.DecompositionProposeDto.ComposantMissingDto;
import ma.nafura.etudes.domain.cps.CpsSection;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.cps.CpsService;
import ma.nafura.etudes.service.port.bc.CatalogResolverPort;
import ma.nafura.etudes.service.port.capability.DecompositionNeedsPort;
import ma.nafura.etudes.service.port.capability.DecompositionNeedsPort.BesoinComposant;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.catalogue.api.CatalogNatureMapping;
import ma.nafura.catalogue.api.CatalogPriceContext;
import ma.nafura.catalogue.api.CatalogPriceSnapshot;
import ma.nafura.catalogue.api.CatalogPriceSource;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Propose une décomposition brouillon : besoins Gemini → catalogue → prix consultables.
 * Ne persiste jamais.
 */
@Service
public class DecompositionProposeService {

    private static final Set<String> SOURCES_CONSULTABLES = Set.of(
            CatalogPriceSource.CONSULTE,
            CatalogPriceSource.CONTRAT,
            CatalogPriceSource.CATALOGUE,
            CatalogPriceSource.TARIF);

    private static final int CATALOG_LIMIT = 8;
    private static final double MATCH_SCORE_MIN = 0.5;

    private final DpgfNoeudRepository noeudRepository;
    private final CpsService cpsService;
    private final DecompositionNeedsPort needsPort;
    private final CatalogResolverPort catalogResolver;
    private final CatalogLookupApi catalogLookupApi;

    public DecompositionProposeService(
            DpgfNoeudRepository noeudRepository,
            CpsService cpsService,
            DecompositionNeedsPort needsPort,
            CatalogResolverPort catalogResolver,
            CatalogLookupApi catalogLookupApi) {
        this.noeudRepository = noeudRepository;
        this.cpsService = cpsService;
        this.needsPort = needsPort;
        this.catalogResolver = catalogResolver;
        this.catalogLookupApi = catalogLookupApi;
    }

    @Transactional(readOnly = true)
    public Optional<DecompositionProposeDto> proposer(
            UUID dossierId, UUID articleId, UUID cpsDocumentId) {
        if (!needsPort.isAvailable()) {
            return Optional.empty();
        }
        DpgfNoeud article = noeudRepository
                .findByIdAndTenantId(articleId, TenantContext.getTenantId())
                .orElse(null);
        if (article == null || !"ARTICLE".equalsIgnoreCase(article.getType())) {
            throw new IllegalArgumentException("etudes.article.introuvable");
        }

        List<CpsSection> sections = List.of();
        if (cpsDocumentId != null) {
            sections = cpsService.rechercherPourArticle(cpsDocumentId, article, 4);
        }

        List<BesoinComposant> besoins = needsPort.extract(article, sections);
        if (besoins == null || besoins.isEmpty()) {
            return Optional.empty();
        }

        List<ComposantMatchedDto> matched = new ArrayList<>();
        List<ComposantMissingDto> missing = new ArrayList<>();
        double confianceSum = 0;
        int count = 0;

        for (BesoinComposant besoin : besoins) {
            if (besoin == null || !StringUtils.hasText(besoin.designation())) {
                continue;
            }
            String type = normalizeDpuType(besoin.type());
            String unite = StringUtils.hasText(besoin.unite())
                    ? besoin.unite().trim()
                    : (article.getUnite() != null ? article.getUnite() : "U");
            BigDecimal rendement = BigDecimal.valueOf(Math.max(besoin.rendement(), 0.0001))
                    .setScale(4, RoundingMode.HALF_UP);
            double conf = clamp(besoin.confiance());

            Optional<ComposantMatchedDto> hit = resolveMatched(besoin.designation().trim(), type, unite, rendement, conf);
            if (hit.isPresent()) {
                matched.add(hit.get());
            } else {
                missing.add(ComposantMissingDto.builder()
                        .type(type)
                        .designation(besoin.designation().trim())
                        .unite(unite)
                        .rendement(rendement)
                        .confiance(conf)
                        .raison("absent_ou_non_tarifé")
                        .build());
            }
            confianceSum += conf;
            count++;
        }

        if (matched.isEmpty() && missing.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(DecompositionProposeDto.builder()
                .matched(matched)
                .missing(missing)
                .confiance(count == 0 ? 0.0 : confianceSum / count)
                .build());
    }

    private Optional<ComposantMatchedDto> resolveMatched(
            String designation, String type, String unite, BigDecimal rendement, double confiance) {
        List<CatalogCandidateDto> candidates = catalogResolver.resolve(designation, type, CATALOG_LIMIT);
        CatalogPriceContext ctx = new CatalogPriceContext(
                LocalDate.now(), null, null, null, null);

        for (CatalogCandidateDto candidate : candidates) {
            if (candidate == null || !StringUtils.hasText(candidate.itemId())) {
                continue;
            }
            if (candidate.score() != null && candidate.score() < MATCH_SCORE_MIN) {
                continue;
            }
            UUID itemId;
            try {
                itemId = UUID.fromString(candidate.itemId());
            } catch (IllegalArgumentException ex) {
                continue;
            }
            CatalogPriceSnapshot prix = catalogLookupApi.resolvePurchasePrice(itemId, ctx);
            if (prix == null
                    || prix.unitPrice() == null
                    || !SOURCES_CONSULTABLES.contains(prix.priceSource())) {
                continue;
            }
            String dpuType = StringUtils.hasText(candidate.nature())
                    ? CatalogNatureMapping.toDpuTypeFromNature(candidate.nature())
                    : type;
            String resolvedUnite = StringUtils.hasText(candidate.unite()) ? candidate.unite() : unite;
            return Optional.of(ComposantMatchedDto.builder()
                    .type(dpuType)
                    .itemId(candidate.itemId())
                    .code(candidate.code())
                    .name(candidate.name())
                    .unite(resolvedUnite)
                    .rendement(rendement)
                    .prixUnitaire(prix.unitPrice())
                    .sourcePrix(prix.priceSource())
                    .prixSourceRefId(prix.sourceRefId())
                    .prixDateSource(prix.sourceDate())
                    .prixCurrencyId(prix.currencyId())
                    .prixLibelleSource(prix.sourceLabel())
                    .confiance(confiance)
                    .suggereParIa(true)
                    .build());
        }
        return Optional.empty();
    }

    private static String normalizeDpuType(String type) {
        if (!StringUtils.hasText(type)) {
            return CatalogNatureMapping.DPU_MATIERE;
        }
        String t = type.trim().toUpperCase();
        return switch (t) {
            case "MAIN_DOEUVRE", "MO" -> CatalogNatureMapping.DPU_MAIN_DOEUVRE;
            case "MATERIEL", "LOCATION", "OUTILLAGE" -> CatalogNatureMapping.DPU_MATERIEL;
            case "SOUS_TRAITANCE" -> CatalogNatureMapping.DPU_SOUS_TRAITANCE;
            default -> CatalogNatureMapping.DPU_MATIERE;
        };
    }

    private static double clamp(double value) {
        if (Double.isNaN(value)) {
            return 0.5;
        }
        return Math.max(0.0, Math.min(1.0, value));
    }
}
