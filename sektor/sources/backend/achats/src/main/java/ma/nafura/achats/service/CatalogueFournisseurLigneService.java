package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import ma.nafura.achats.api.request.CatalogueFournisseurLigneCreateDto;
import ma.nafura.achats.api.request.CatalogueFournisseurLigneUpdateDto;
import ma.nafura.achats.domain.contrat.CatalogueSource;
import ma.nafura.achats.domain.contrat.CatalogueFournisseurLigne;
import ma.nafura.achats.repository.CatalogueFournisseurLigneRepository;
import ma.nafura.finance.domain.devise.Currency;
import ma.nafura.finance.service.CurrencyConversionService;
import ma.nafura.catalogue.repository.UnitOfMeasureRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CatalogueFournisseurLigneService {

    private final CatalogueFournisseurLigneRepository repository;
    private final CurrencyConversionService currencyConversionService;
    private final PrixNormaliseCatalogueService prixNormaliseCatalogueService;
    private final UnitOfMeasureRepository uomRepository;

    public CatalogueFournisseurLigneService(
            CatalogueFournisseurLigneRepository repository,
            CurrencyConversionService currencyConversionService,
            PrixNormaliseCatalogueService prixNormaliseCatalogueService,
            UnitOfMeasureRepository uomRepository) {
        this.repository = repository;
        this.currencyConversionService = currencyConversionService;
        this.prixNormaliseCatalogueService = prixNormaliseCatalogueService;
        this.uomRepository = uomRepository;
    }

    @Transactional(readOnly = true)
    public List<CatalogueFournisseurLigne> list(
            String fournisseurId, String articleId, Boolean actif, String search) {
        UUID tenantId = tenantId();
        List<CatalogueFournisseurLigne> rows = loadRows(
                tenantId, parseUuidOrNull(fournisseurId), parseUuidOrNull(articleId), actif);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(row -> matchesSearch(row, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public CatalogueFournisseurLigne getById(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("achats.catalogue.ligne_introuvable"));
    }

    @Transactional
    public CatalogueFournisseurLigne create(CatalogueFournisseurLigneCreateDto request) {
        UUID tenantId = tenantId();
        LocalDate validFrom =
                request.getValidFrom() != null ? request.getValidFrom() : LocalDate.now();
        return upsertHistorise(
                tenantId,
                request.getFournisseurId(),
                request.getArticleId(),
                request.getDesignation().trim(),
                request.getPrixUnitaireHt(),
                trimOrNull(request.getRefFournisseur()),
                request.getUomId(),
                request.getConditionnementQuantite(),
                request.getConditionnementUomId(),
                request.getCurrencyId() != null ? request.getCurrencyId() : resolvePivotCurrencyId(tenantId),
                validFrom,
                request.getRemisePercent() != null ? request.getRemisePercent() : BigDecimal.ZERO,
                request.getQuantiteMin(),
                request.getDelaiJours(),
                StringUtils.hasText(request.getSource())
                        ? request.getSource().trim()
                        : CatalogueSource.SAISIE_MANUELLE,
                request.getSourceRefId(),
                trimOrNull(request.getIncoterm()),
                request.getActif() != null ? request.getActif() : true);
    }

    /**
     * Historise : ferme la ligne ouverte précédente puis crée une nouvelle ligne.
     * Ne jamais écraser un prix. Recalcule {@code prix_normalise}.
     */
    @Transactional
    public CatalogueFournisseurLigne upsertHistorise(
            UUID tenantId,
            UUID fournisseurId,
            UUID articleId,
            String designation,
            BigDecimal prixUnitaireHt,
            String refFournisseur,
            UUID uomId,
            BigDecimal conditionnementQuantite,
            UUID conditionnementUomId,
            UUID currencyId,
            LocalDate validFrom,
            BigDecimal remisePercent,
            BigDecimal quantiteMin,
            Integer delaiJours,
            String source,
            UUID sourceRefId,
            String incoterm,
            boolean actif) {
        LocalDate from = validFrom != null ? validFrom : LocalDate.now();
        repository
                .findByTenantIdAndFournisseurIdAndArticleIdAndActifTrueAndValidToIsNull(
                        tenantId, fournisseurId, articleId)
                .ifPresent(previous -> {
                    previous.setValidTo(from.minusDays(1));
                    previous.setUpdatedAt(OffsetDateTime.now());
                    repository.save(previous);
                });

        CatalogueFournisseurLigne entity = CatalogueFournisseurLigne.builder()
                .tenantId(tenantId)
                .fournisseurId(fournisseurId)
                .articleId(articleId)
                .refFournisseur(refFournisseur)
                .designation(designation)
                .prixUnitaireHt(prixUnitaireHt)
                .uomId(uomId)
                .conditionnementQuantite(conditionnementQuantite)
                .conditionnementUomId(conditionnementUomId)
                .currencyId(currencyId != null ? currencyId : resolvePivotCurrencyId(tenantId))
                .validFrom(from)
                .validTo(null)
                .remisePercent(remisePercent != null ? remisePercent : BigDecimal.ZERO)
                .quantiteMin(quantiteMin)
                .delaiJours(delaiJours)
                .source(source != null ? source : CatalogueSource.SAISIE_MANUELLE)
                .sourceRefId(sourceRefId)
                .incoterm(incoterm)
                .actif(actif)
                .build();
        prixNormaliseCatalogueService.apply(entity);
        return repository.save(entity);
    }

    /**
     * Résout un code UOM historique (alimentation offre/facture) vers un UUID, ou null.
     */
    @Transactional(readOnly = true)
    public UUID resolveUomIdByCode(UUID tenantId, String uomCode) {
        if (!StringUtils.hasText(uomCode) || tenantId == null) {
            return null;
        }
        return uomRepository
                .findByTenantIdAndCodeIgnoreCase(tenantId, uomCode.trim())
                .map(u -> u.getId())
                .orElse(null);
    }

    @Transactional
    public CatalogueFournisseurLigne update(UUID id, CatalogueFournisseurLigneUpdateDto request) {
        CatalogueFournisseurLigne entity = getById(id);
        boolean prixChange = request.getPrixUnitaireHt() != null
                && request.getPrixUnitaireHt().compareTo(entity.getPrixUnitaireHt()) != 0;
        boolean conditionnementChange = (request.getConditionnementQuantite() != null
                        && (entity.getConditionnementQuantite() == null
                                || request.getConditionnementQuantite()
                                                .compareTo(entity.getConditionnementQuantite())
                                        != 0))
                || (request.getConditionnementUomId() != null
                        && !Objects.equals(request.getConditionnementUomId(), entity.getConditionnementUomId()))
                || (request.getRemisePercent() != null
                        && request.getRemisePercent().compareTo(entity.getRemisePercent()) != 0);

        if (prixChange) {
            return upsertHistorise(
                    tenantId(),
                    request.getFournisseurId() != null ? request.getFournisseurId() : entity.getFournisseurId(),
                    request.getArticleId() != null ? request.getArticleId() : entity.getArticleId(),
                    request.getDesignation() != null
                            ? request.getDesignation().trim()
                            : entity.getDesignation(),
                    request.getPrixUnitaireHt(),
                    request.getRefFournisseur() != null
                            ? trimOrNull(request.getRefFournisseur())
                            : entity.getRefFournisseur(),
                    request.getUomId() != null ? request.getUomId() : entity.getUomId(),
                    request.getConditionnementQuantite() != null
                            ? request.getConditionnementQuantite()
                            : entity.getConditionnementQuantite(),
                    request.getConditionnementUomId() != null
                            ? request.getConditionnementUomId()
                            : entity.getConditionnementUomId(),
                    request.getCurrencyId() != null ? request.getCurrencyId() : entity.getCurrencyId(),
                    request.getValidFrom() != null ? request.getValidFrom() : LocalDate.now(),
                    request.getRemisePercent() != null
                            ? request.getRemisePercent()
                            : entity.getRemisePercent(),
                    request.getQuantiteMin() != null ? request.getQuantiteMin() : entity.getQuantiteMin(),
                    request.getDelaiJours() != null ? request.getDelaiJours() : entity.getDelaiJours(),
                    request.getSource() != null ? request.getSource() : entity.getSource(),
                    request.getSourceRefId() != null ? request.getSourceRefId() : entity.getSourceRefId(),
                    request.getIncoterm() != null ? trimOrNull(request.getIncoterm()) : entity.getIncoterm(),
                    request.getActif() != null ? request.getActif() : Boolean.TRUE.equals(entity.getActif()));
        }
        if (request.getFournisseurId() != null) {
            entity.setFournisseurId(request.getFournisseurId());
        }
        if (request.getArticleId() != null) {
            entity.setArticleId(request.getArticleId());
        }
        if (request.getRefFournisseur() != null) {
            entity.setRefFournisseur(trimOrNull(request.getRefFournisseur()));
        }
        if (request.getDesignation() != null) {
            entity.setDesignation(request.getDesignation().trim());
        }
        if (request.getUomId() != null) {
            entity.setUomId(request.getUomId());
        }
        if (request.getConditionnementQuantite() != null) {
            entity.setConditionnementQuantite(request.getConditionnementQuantite());
        }
        if (request.getConditionnementUomId() != null) {
            entity.setConditionnementUomId(request.getConditionnementUomId());
        }
        if (request.getCurrencyId() != null) {
            entity.setCurrencyId(request.getCurrencyId());
        }
        if (request.getValidFrom() != null) {
            entity.setValidFrom(request.getValidFrom());
        }
        if (request.getValidTo() != null) {
            entity.setValidTo(request.getValidTo());
        }
        if (request.getRemisePercent() != null) {
            entity.setRemisePercent(request.getRemisePercent());
        }
        if (request.getQuantiteMin() != null) {
            entity.setQuantiteMin(request.getQuantiteMin());
        }
        if (request.getDelaiJours() != null) {
            entity.setDelaiJours(request.getDelaiJours());
        }
        if (request.getSource() != null) {
            entity.setSource(request.getSource());
        }
        if (request.getSourceRefId() != null) {
            entity.setSourceRefId(request.getSourceRefId());
        }
        if (request.getIncoterm() != null) {
            entity.setIncoterm(trimOrNull(request.getIncoterm()));
        }
        if (request.getActif() != null) {
            entity.setActif(request.getActif());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        if (conditionnementChange || request.getRemisePercent() != null) {
            prixNormaliseCatalogueService.apply(entity);
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id) {
        CatalogueFournisseurLigne entity = getById(id);
        repository.delete(entity);
    }

    private UUID resolvePivotCurrencyId(UUID tenantId) {
        return currencyConversionService
                .findReferenceCurrency(tenantId)
                .map(Currency::getId)
                .orElse(null);
    }

    private List<CatalogueFournisseurLigne> loadRows(
            UUID tenantId, UUID fournisseurId, UUID articleId, Boolean actif) {
        List<CatalogueFournisseurLigne> rows;
        if (fournisseurId != null && articleId != null) {
            rows = repository.findByTenantIdAndArticleIdOrderByDesignationAsc(tenantId, articleId).stream()
                    .filter(r -> fournisseurId.equals(r.getFournisseurId()))
                    .toList();
        } else if (fournisseurId != null) {
            rows = repository.findByTenantIdAndFournisseurIdOrderByDesignationAsc(tenantId, fournisseurId);
        } else if (articleId != null) {
            rows = repository.findByTenantIdAndArticleIdOrderByDesignationAsc(tenantId, articleId);
        } else {
            rows = repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        }
        if (actif != null) {
            rows = rows.stream().filter(row -> actif.equals(row.getActif())).toList();
        }
        return rows;
    }

    private boolean matchesSearch(CatalogueFournisseurLigne row, String term) {
        return contains(row.getDesignation(), term)
                || contains(row.getRefFournisseur(), term)
                || contains(row.getFournisseurId() != null ? row.getFournisseurId().toString() : null, term)
                || contains(row.getArticleId() != null ? row.getArticleId().toString() : null, term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static UUID parseUuidOrNull(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
