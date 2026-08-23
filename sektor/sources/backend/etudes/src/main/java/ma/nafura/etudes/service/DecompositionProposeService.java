package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.catalogue.api.CatalogNatureMapping;
import ma.nafura.catalogue.api.CatalogPriceContext;
import ma.nafura.catalogue.api.CatalogPriceSnapshot;
import ma.nafura.catalogue.api.CatalogPriceSource;
import ma.nafura.catalogue.api.IdentiteClasse;
import ma.nafura.etudes.api.dto.DecompositionProposeDto;
import ma.nafura.etudes.api.dto.DecompositionProposeDto.ComposantIncertainDto;
import ma.nafura.etudes.api.dto.DecompositionProposeDto.ComposantMatchedDto;
import ma.nafura.etudes.api.dto.DecompositionProposeDto.ComposantMissingDto;
import ma.nafura.etudes.domain.cps.CpsSection;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.cps.CpsService;
import ma.nafura.etudes.service.port.capability.DecompositionNeedsPort;
import ma.nafura.etudes.service.port.capability.DecompositionNeedsPort.BesoinComposant;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Propose une décomposition brouillon : besoins Gemini → identité Extraire → deux seaux.
 * Ne persiste jamais (pas d'auto-création Item / Sektor).
 */
@Service
public class DecompositionProposeService {

    private static final Set<String> SOURCES_CONSULTABLES = Set.of(
            CatalogPriceSource.CONSULTE,
            CatalogPriceSource.CONTRAT,
            CatalogPriceSource.CATALOGUE,
            CatalogPriceSource.TARIF);

    private final DpgfNoeudRepository noeudRepository;
    private final CpsService cpsService;
    private final DecompositionNeedsPort needsPort;
    private final CatalogLookupApi catalogLookupApi;

    public DecompositionProposeService(
            DpgfNoeudRepository noeudRepository,
            CpsService cpsService,
            DecompositionNeedsPort needsPort,
            CatalogLookupApi catalogLookupApi) {
        this.noeudRepository = noeudRepository;
        this.cpsService = cpsService;
        this.needsPort = needsPort;
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
        List<ComposantIncertainDto> uncertain = new ArrayList<>();
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

            IdentiteClasse classe = catalogLookupApi.classerIdentite(besoin.designation().trim(), type);
            if (classe != null && IdentiteClasse.INCERTAIN.equals(classe.seau())) {
                uncertain.add(ComposantIncertainDto.builder()
                        .type(type)
                        .designation(besoin.designation().trim())
                        .unite(unite)
                        .rendement(rendement)
                        .confiance(conf)
                        .identitesCandidates(classe.identitesCandidates())
                        .build());
            } else if (classe != null && IdentiteClasse.DEJA_TENANT.equals(classe.seau())
                    && StringUtils.hasText(classe.itemId())) {
                matched.add(toMatched(classe, type, unite, rendement, conf));
            } else {
                String designation = classe != null && StringUtils.hasText(classe.libelle())
                        ? classe.libelle()
                        : besoin.designation().trim();
                missing.add(ComposantMissingDto.builder()
                        .type(type)
                        .designation(designation)
                        .cleStable(classe != null ? classe.cleStable() : null)
                        .unite(unite)
                        .rendement(rendement)
                        .confiance(conf)
                        .raison("a_creer")
                        .build());
            }
            confianceSum += conf;
            count++;
        }

        if (matched.isEmpty() && missing.isEmpty() && uncertain.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(DecompositionProposeDto.builder()
                .matched(matched)
                .missing(missing)
                .uncertain(uncertain)
                .confiance(count == 0 ? 0.0 : confianceSum / count)
                .build());
    }

    private ComposantMatchedDto toMatched(
            IdentiteClasse classe, String type, String unite, BigDecimal rendement, double confiance) {
        UUID itemId = UUID.fromString(classe.itemId());
        CatalogItemSnapshot item = catalogLookupApi.getItem(itemId).orElse(null);
        CatalogPriceContext ctx = new CatalogPriceContext(LocalDate.now(), null, null, null, null);
        CatalogPriceSnapshot prix = catalogLookupApi.resolvePurchasePrice(itemId, ctx);
        boolean consultable = prix != null
                && prix.unitPrice() != null
                && SOURCES_CONSULTABLES.contains(prix.priceSource());
        String dpuType = item != null && StringUtils.hasText(item.nature())
                ? CatalogNatureMapping.toDpuTypeFromNature(item.nature())
                : type;
        String resolvedUnite = item != null && StringUtils.hasText(item.unite()) ? item.unite() : unite;
        String name = item != null && StringUtils.hasText(item.name())
                ? item.name()
                : (StringUtils.hasText(classe.libelle()) ? classe.libelle() : classe.cleStable());
        return ComposantMatchedDto.builder()
                .type(dpuType)
                .itemId(classe.itemId())
                .cleStable(classe.cleStable())
                .code(item != null ? item.code() : null)
                .name(name)
                .unite(resolvedUnite)
                .rendement(rendement)
                .prixUnitaire(consultable ? prix.unitPrice() : null)
                .sourcePrix(consultable ? prix.priceSource() : null)
                .prixSourceRefId(consultable ? prix.sourceRefId() : null)
                .prixDateSource(consultable ? prix.sourceDate() : null)
                .prixCurrencyId(consultable ? prix.currencyId() : null)
                .prixLibelleSource(consultable ? prix.sourceLabel() : null)
                .confiance(confiance)
                .suggereParIa(true)
                .build();
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
