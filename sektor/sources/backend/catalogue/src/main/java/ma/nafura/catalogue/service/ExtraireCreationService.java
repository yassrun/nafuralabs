package ma.nafura.catalogue.service;

import ma.nafura.catalogue.api.dto.ExtraireCreerDto;
import ma.nafura.catalogue.api.request.ItemCreateDto;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.domain.ouvrage.CatalogArticle;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.UnitOfMeasureRepository;
import ma.nafura.catalogue.seeders.CatalogSeedService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Extraire — confirmer une création : PUBLIER l'identité Sektor (pas G2), puis Item 1–1.
 */
@Service
public class ExtraireCreationService {

    private final CatalogArticleRepository articleRepository;
    private final ItemService itemService;
    private final UnitOfMeasureRepository unitOfMeasureRepository;

    public ExtraireCreationService(
            CatalogArticleRepository articleRepository,
            ItemService itemService,
            UnitOfMeasureRepository unitOfMeasureRepository) {
        this.articleRepository = articleRepository;
        this.itemService = itemService;
        this.unitOfMeasureRepository = unitOfMeasureRepository;
    }

    @Transactional
    public ExtraireCreerDto creer(String designation, String nature, String uniteCode, String cleStableHint) {
        if (!StringUtils.hasText(designation) && !StringUtils.hasText(cleStableHint)) {
            throw new IllegalArgumentException("item.extraire.designation_requise");
        }
        String natureCode = StringUtils.hasText(nature) ? nature.trim().toUpperCase() : "MATIERE";
        String unite = StringUtils.hasText(uniteCode) ? uniteCode.trim() : "U";
        String cle = StringUtils.hasText(cleStableHint)
                ? cleStableHint.trim()
                : CatalogSlug.from(designation.trim());

        CatalogArticle article = articleRepository.findByCleStable(cle).orElse(null);
        boolean createdSektor = false;
        if (article == null) {
            String libelle = StringUtils.hasText(designation) ? designation.trim() : cle;
            article = articleRepository.save(CatalogArticle.builder()
                    .cleStable(cle)
                    .nature(natureCode)
                    .libelle(libelle)
                    .uniteCode(unite)
                    .statut("PUBLIE")
                    .editionPublication(CatalogSeedService.EDITION_DEMO)
                    .build());
            createdSektor = true;
        } else if (!"PUBLIE".equalsIgnoreCase(article.getStatut())) {
            article.setStatut("PUBLIE");
            if (!StringUtils.hasText(article.getEditionPublication())) {
                article.setEditionPublication(CatalogSeedService.EDITION_DEMO);
            }
            article = articleRepository.save(article);
            createdSektor = true;
        }

        Item existing = itemService.findByCleStable(article.getCleStable()).orElse(null);
        if (existing != null) {
            return new ExtraireCreerDto(
                    existing.getId().toString(),
                    article.getCleStable(),
                    existing.getName(),
                    createdSektor,
                    false);
        }

        ItemCreateDto dto = new ItemCreateDto();
        dto.setName(article.getLibelle());
        dto.setNature(article.getNature());
        dto.setCleStable(article.getCleStable());
        dto.setIsActive(true);
        if (StringUtils.hasText(article.getUniteCode())) {
            unitOfMeasureRepository
                    .findByTenantIdAndCodeIgnoreCase(
                            TenantContext.getTenantId(), article.getUniteCode())
                    .ifPresent(uom -> dto.setUnitOfMeasureId(uom.getId()));
        }
        Item item = itemService.create(dto);
        return new ExtraireCreerDto(
                item.getId().toString(),
                article.getCleStable(),
                item.getName(),
                createdSektor,
                true);
    }
}
