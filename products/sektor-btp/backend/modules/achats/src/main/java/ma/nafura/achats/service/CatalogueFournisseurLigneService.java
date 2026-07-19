package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.achats.api.request.CatalogueFournisseurLigneCreateDto;
import ma.nafura.achats.api.request.CatalogueFournisseurLigneUpdateDto;
import ma.nafura.achats.domain.CatalogueSource;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.achats.repository.CatalogueFournisseurLigneRepository;
import ma.nafura.currency.domain.model.Currency;
import ma.nafura.currency.service.CurrencyConversionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CatalogueFournisseurLigneService {

    private final CatalogueFournisseurLigneRepository repository;
    private final CurrencyConversionService currencyConversionService;

    public CatalogueFournisseurLigneService(
            CatalogueFournisseurLigneRepository repository,
            CurrencyConversionService currencyConversionService) {
        this.repository = repository;
        this.currencyConversionService = currencyConversionService;
    }

    @Transactional(readOnly = true)
    public List<CatalogueFournisseurLigne> list(
            String fournisseurId, String articleId, Boolean actif, String search) {
        UUID tenantId = tenantId();
        List<CatalogueFournisseurLigne> rows = loadRows(tenantId, fournisseurId, articleId, actif);
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
                request.getFournisseurId().trim(),
                request.getArticleId().trim(),
                request.getDesignation().trim(),
                request.getPrixUnitaireHt(),
                trimOrNull(request.getRefFournisseur()),
                trimOrNull(request.getUom()),
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
     * Ne jamais écraser un prix.
     */
    @Transactional
    public CatalogueFournisseurLigne upsertHistorise(
            UUID tenantId,
            String fournisseurId,
            String articleId,
            String designation,
            BigDecimal prixUnitaireHt,
            String refFournisseur,
            String uom,
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
                .uom(uom)
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
        return repository.save(entity);
    }

    @Transactional
    public CatalogueFournisseurLigne update(UUID id, CatalogueFournisseurLigneUpdateDto request) {
        CatalogueFournisseurLigne entity = getById(id);
        // Un changement de prix crée une nouvelle version historisée plutôt qu'un écrasement
        if (request.getPrixUnitaireHt() != null
                && request.getPrixUnitaireHt().compareTo(entity.getPrixUnitaireHt()) != 0) {
            return upsertHistorise(
                    tenantId(),
                    request.getFournisseurId() != null
                            ? request.getFournisseurId().trim()
                            : entity.getFournisseurId(),
                    request.getArticleId() != null
                            ? request.getArticleId().trim()
                            : entity.getArticleId(),
                    request.getDesignation() != null
                            ? request.getDesignation().trim()
                            : entity.getDesignation(),
                    request.getPrixUnitaireHt(),
                    request.getRefFournisseur() != null
                            ? trimOrNull(request.getRefFournisseur())
                            : entity.getRefFournisseur(),
                    request.getUom() != null ? trimOrNull(request.getUom()) : entity.getUom(),
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
            entity.setFournisseurId(request.getFournisseurId().trim());
        }
        if (request.getArticleId() != null) {
            entity.setArticleId(request.getArticleId().trim());
        }
        if (request.getRefFournisseur() != null) {
            entity.setRefFournisseur(trimOrNull(request.getRefFournisseur()));
        }
        if (request.getDesignation() != null) {
            entity.setDesignation(request.getDesignation().trim());
        }
        if (request.getUom() != null) {
            entity.setUom(trimOrNull(request.getUom()));
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
            UUID tenantId, String fournisseurId, String articleId, Boolean actif) {
        List<CatalogueFournisseurLigne> rows;
        if (StringUtils.hasText(fournisseurId) && StringUtils.hasText(articleId)) {
            rows = repository.findByTenantIdAndArticleIdOrderByDesignationAsc(tenantId, articleId.trim()).stream()
                    .filter(r -> fournisseurId.trim().equals(r.getFournisseurId()))
                    .toList();
        } else if (StringUtils.hasText(fournisseurId)) {
            rows = repository.findByTenantIdAndFournisseurIdOrderByDesignationAsc(
                    tenantId, fournisseurId.trim());
        } else if (StringUtils.hasText(articleId)) {
            rows = repository.findByTenantIdAndArticleIdOrderByDesignationAsc(tenantId, articleId.trim());
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
                || contains(row.getFournisseurId(), term)
                || contains(row.getArticleId(), term);
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

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
