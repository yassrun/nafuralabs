package ma.nafura.achats.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.achats.api.request.CatalogueFournisseurLigneCreateDto;
import ma.nafura.achats.api.request.CatalogueFournisseurLigneUpdateDto;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.achats.repository.CatalogueFournisseurLigneRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CatalogueFournisseurLigneService {

    private final CatalogueFournisseurLigneRepository repository;

    public CatalogueFournisseurLigneService(CatalogueFournisseurLigneRepository repository) {
        this.repository = repository;
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
                .orElseThrow(() -> new IllegalArgumentException("Catalogue fournisseur ligne not found"));
    }

    @Transactional
    public CatalogueFournisseurLigne create(CatalogueFournisseurLigneCreateDto request) {
        UUID tenantId = tenantId();
        String fournisseurId = request.getFournisseurId().trim();
        String articleId = request.getArticleId().trim();
        if (repository.existsByTenantIdAndFournisseurIdAndArticleId(tenantId, fournisseurId, articleId)) {
            throw new IllegalArgumentException("Catalogue entry already exists for this supplier and article");
        }
        CatalogueFournisseurLigne entity = CatalogueFournisseurLigne.builder()
                .tenantId(tenantId)
                .fournisseurId(fournisseurId)
                .articleId(articleId)
                .refFournisseur(trimOrNull(request.getRefFournisseur()))
                .designation(request.getDesignation().trim())
                .prixUnitaireHt(request.getPrixUnitaireHt())
                .uom(trimOrNull(request.getUom()))
                .actif(request.getActif() != null ? request.getActif() : true)
                .build();
        return repository.save(entity);
    }

    @Transactional
    public CatalogueFournisseurLigne update(UUID id, CatalogueFournisseurLigneUpdateDto request) {
        CatalogueFournisseurLigne entity = getById(id);
        String nextFournisseurId = request.getFournisseurId() != null
                ? request.getFournisseurId().trim()
                : entity.getFournisseurId();
        String nextArticleId = request.getArticleId() != null
                ? request.getArticleId().trim()
                : entity.getArticleId();
        if (!nextFournisseurId.equals(entity.getFournisseurId())
                || !nextArticleId.equals(entity.getArticleId())) {
            repository
                    .findByTenantIdAndFournisseurIdAndArticleId(tenantId(), nextFournisseurId, nextArticleId)
                    .filter(existing -> !existing.getId().equals(entity.getId()))
                    .ifPresent(ignored -> {
                        throw new IllegalArgumentException(
                                "Catalogue entry already exists for this supplier and article");
                    });
        }
        if (request.getFournisseurId() != null) {
            entity.setFournisseurId(nextFournisseurId);
        }
        if (request.getArticleId() != null) {
            entity.setArticleId(nextArticleId);
        }
        if (request.getRefFournisseur() != null) {
            entity.setRefFournisseur(trimOrNull(request.getRefFournisseur()));
        }
        if (request.getDesignation() != null) {
            entity.setDesignation(request.getDesignation().trim());
        }
        if (request.getPrixUnitaireHt() != null) {
            entity.setPrixUnitaireHt(request.getPrixUnitaireHt());
        }
        if (request.getUom() != null) {
            entity.setUom(trimOrNull(request.getUom()));
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

    private List<CatalogueFournisseurLigne> loadRows(
            UUID tenantId, String fournisseurId, String articleId, Boolean actif) {
        List<CatalogueFournisseurLigne> rows;
        if (StringUtils.hasText(fournisseurId) && StringUtils.hasText(articleId)) {
            rows = repository
                    .findByTenantIdAndFournisseurIdAndArticleId(
                            tenantId, fournisseurId.trim(), articleId.trim())
                    .map(List::of)
                    .orElse(List.of());
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
