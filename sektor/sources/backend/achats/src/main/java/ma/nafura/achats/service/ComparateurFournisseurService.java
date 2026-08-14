package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.dto.ComparateurOffreDto;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.achats.repository.CatalogueFournisseurLigneRepository;
import ma.nafura.catalogue.domain.model.UnitOfMeasure;
import ma.nafura.catalogue.repository.UnitOfMeasureRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * L11 — compare les offres catalogue d'un article à une date.
 * Tri par {@code prix_normalise} croissant ; prix périmés inclus et marqués.
 */
@Service
public class ComparateurFournisseurService {

    private final CatalogueFournisseurLigneRepository catalogueRepository;
    private final UnitOfMeasureRepository uomRepository;

    public ComparateurFournisseurService(
            CatalogueFournisseurLigneRepository catalogueRepository,
            UnitOfMeasureRepository uomRepository) {
        this.catalogueRepository = catalogueRepository;
        this.uomRepository = uomRepository;
    }

    @Transactional(readOnly = true)
    public List<ComparateurOffreDto> comparer(UUID articleId, LocalDate date) {
        if (articleId == null) {
            throw new IllegalArgumentException("achats.comparateur.article_requis");
        }
        LocalDate ref = date != null ? date : LocalDate.now();
        UUID tenantId = TenantContext.getTenantId();

        // Toutes les lignes actives pour l'article — y compris périmées (valid_to < date)
        List<CatalogueFournisseurLigne> rows =
                catalogueRepository.findByTenantIdAndArticleIdOrderByDesignationAsc(tenantId, articleId).stream()
                        .filter(r -> Boolean.TRUE.equals(r.getActif()))
                        .filter(r -> r.getValidFrom() == null || !r.getValidFrom().isAfter(ref))
                        .toList();

        return rows.stream()
                .map(r -> toDto(r, ref))
                .sorted(comparateurOrder())
                .toList();
    }

    /**
     * Tri : prix normalisé croissant (nulls last), puis délai, puis désignation.
     */
    static Comparator<ComparateurOffreDto> comparateurOrder() {
        return Comparator.comparing(
                        ComparateurOffreDto::getPrixNormalise,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(
                        ComparateurOffreDto::getDelaiJours,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(
                        ComparateurOffreDto::getDesignation,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
    }

    private ComparateurOffreDto toDto(CatalogueFournisseurLigne row, LocalDate ref) {
        String condUomCode = resolveUomCode(row.getConditionnementUomId());
        String normUomCode = resolveUomCode(row.getUomNormaliseId());
        String conditionnementLibelle = formatConditionnement(row.getConditionnementQuantite(), condUomCode);

        return ComparateurOffreDto.builder()
                .ligneId(row.getId())
                .fournisseurId(row.getFournisseurId())
                .articleId(row.getArticleId())
                .designation(row.getDesignation())
                .refFournisseur(row.getRefFournisseur())
                .prixCommercialHt(row.prixNetHt())
                .prixUnitaireHt(row.getPrixUnitaireHt())
                .remisePercent(row.getRemisePercent())
                .conditionnementQuantite(row.getConditionnementQuantite())
                .conditionnementUomId(row.getConditionnementUomId())
                .conditionnementUomCode(condUomCode)
                .conditionnementLibelle(conditionnementLibelle)
                .prixNormalise(row.getPrixNormalise())
                .uomNormaliseId(row.getUomNormaliseId())
                .uomNormaliseCode(normUomCode)
                .delaiJours(row.getDelaiJours())
                .quantiteMin(row.getQuantiteMin())
                .validFrom(row.getValidFrom())
                .validTo(row.getValidTo())
                .perime(row.isPerimeAt(ref))
                .source(row.getSource())
                .build();
    }

    private String resolveUomCode(UUID uomId) {
        if (uomId == null) {
            return null;
        }
        return uomRepository
                .findByIdAndTenantId(uomId, TenantContext.getTenantId())
                .map(UnitOfMeasure::getCode)
                .orElse(null);
    }

    static String formatConditionnement(BigDecimal qty, String uomCode) {
        if (qty == null && uomCode == null) {
            return null;
        }
        if (qty == null) {
            return uomCode;
        }
        String q = qty.stripTrailingZeros().toPlainString();
        if (uomCode == null || uomCode.isBlank()) {
            return q;
        }
        return q + " " + uomCode;
    }
}
