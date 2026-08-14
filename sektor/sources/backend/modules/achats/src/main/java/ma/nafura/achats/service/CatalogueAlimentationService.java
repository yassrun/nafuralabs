package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.domain.CatalogueSource;
import ma.nafura.achats.domain.model.AppelOffreLigne;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.BonCommandeAchatLigne;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.achats.domain.model.ContratFournisseur;
import ma.nafura.achats.domain.model.FactureFournisseur;
import ma.nafura.achats.domain.model.FactureFournisseurLigne;
import ma.nafura.achats.domain.model.OffreFournisseur;
import ma.nafura.achats.domain.model.OffreFournisseurLigne;
import ma.nafura.achats.repository.CatalogueFournisseurLigneRepository;
import ma.nafura.currency.domain.model.Currency;
import ma.nafura.currency.service.CurrencyConversionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Alimente le catalogue fournisseur depuis les événements achats (lot 9 T9.4 / T9.4bis).
 * Historise toujours : ferme la ligne ouverte puis crée une nouvelle.
 */
@Service
public class CatalogueAlimentationService {

    private static final Logger log = LoggerFactory.getLogger(CatalogueAlimentationService.class);

    private final CatalogueFournisseurLigneService catalogueService;
    private final CatalogueFournisseurLigneRepository catalogueRepository;
    private final CurrencyConversionService currencyConversionService;
    private final BonCommandeAchatService bonCommandeAchatService;

    public CatalogueAlimentationService(
            CatalogueFournisseurLigneService catalogueService,
            CatalogueFournisseurLigneRepository catalogueRepository,
            CurrencyConversionService currencyConversionService,
            BonCommandeAchatService bonCommandeAchatService) {
        this.catalogueService = catalogueService;
        this.catalogueRepository = catalogueRepository;
        this.currencyConversionService = currencyConversionService;
        this.bonCommandeAchatService = bonCommandeAchatService;
    }

    @Transactional
    public void fromOffreRetenue(OffreFournisseur offre) {
        if (offre == null || offre.getLignes() == null) {
            return;
        }
        UUID tenantId = offre.getTenantId() != null ? offre.getTenantId() : TenantContext.getTenantId();
        UUID currencyId = pivotCurrencyId(tenantId);
        LocalDate validFrom =
                offre.getDateReponse() != null ? offre.getDateReponse() : LocalDate.now();
        UUID fournisseurId = parseUuidOrNull(offre.getFournisseurId());
        if (fournisseurId == null) {
            log.warn("achats.catalogue.alimentation.offre_fournisseur_invalide offreId={}", offre.getId());
            return;
        }
        for (OffreFournisseurLigne ligne : offre.getLignes()) {
            AppelOffreLigne aoLigne = ligne.getAppelOffreLigne();
            if (aoLigne == null || !StringUtils.hasText(aoLigne.getArticleId())) {
                continue;
            }
            UUID articleId = parseUuidOrNull(aoLigne.getArticleId());
            if (articleId == null) {
                continue;
            }
            String designation = StringUtils.hasText(aoLigne.getArticleName())
                    ? aoLigne.getArticleName()
                    : aoLigne.getArticleId();
            catalogueService.upsertHistorise(
                    tenantId,
                    fournisseurId,
                    articleId,
                    designation,
                    ligne.getPrixUnitaireHt(),
                    null,
                    catalogueService.resolveUomIdByCode(tenantId, aoLigne.getUomCode()),
                    null,
                    null,
                    currencyId,
                    validFrom,
                    BigDecimal.ZERO,
                    null,
                    ligne.getDelaiSpecifique() != null
                            ? ligne.getDelaiSpecifique()
                            : offre.getDelaiLivraisonJours(),
                    CatalogueSource.OFFRE_RETENUE,
                    ligne.getId(),
                    null,
                    true);
        }
    }

    @Transactional
    public void fromFactureValidee(FactureFournisseur facture) {
        if (facture == null || facture.getLignes() == null) {
            return;
        }
        UUID tenantId = facture.getTenantId() != null ? facture.getTenantId() : TenantContext.getTenantId();
        UUID currencyId = pivotCurrencyId(tenantId);
        LocalDate validFrom =
                facture.getDateFacture() != null ? facture.getDateFacture() : LocalDate.now();
        UUID fournisseurId = parseUuidOrNull(facture.getFournisseurId());
        if (fournisseurId == null) {
            log.warn("achats.catalogue.alimentation.facture_fournisseur_invalide factureId={}", facture.getId());
            return;
        }

        BonCommandeAchat bc = null;
        if (facture.getBcId() != null) {
            try {
                bc = bonCommandeAchatService.getById(facture.getBcId());
            } catch (RuntimeException ex) {
                log.warn("achats.catalogue.alimentation.bc_introuvable bcId={}", facture.getBcId());
            }
        }

        for (FactureFournisseurLigne ligne : facture.getLignes()) {
            if (ligne.getPrixUnitaireHt() == null) {
                continue;
            }
            String articleIdRaw = null;
            String designation = ligne.getDesignation();
            String uomCode = null;
            if (ligne.getBcLigneId() != null && bc != null && bc.getLignes() != null) {
                for (BonCommandeAchatLigne bcLigne : bc.getLignes()) {
                    if (ligne.getBcLigneId().equals(bcLigne.getId())) {
                        articleIdRaw = bcLigne.getArticleId();
                        if (StringUtils.hasText(bcLigne.getArticleName())) {
                            designation = bcLigne.getArticleName();
                        }
                        uomCode = bcLigne.getUomCode();
                        break;
                    }
                }
            }
            UUID articleId = parseUuidOrNull(articleIdRaw);
            if (articleId == null) {
                log.debug(
                        "achats.catalogue.alimentation.facture_ligne_sans_article factureId={} ligneId={}",
                        facture.getId(),
                        ligne.getId());
                continue;
            }
            catalogueService.upsertHistorise(
                    tenantId,
                    fournisseurId,
                    articleId,
                    designation != null ? designation : articleId.toString(),
                    ligne.getPrixUnitaireHt(),
                    null,
                    catalogueService.resolveUomIdByCode(tenantId, uomCode),
                    null,
                    null,
                    currencyId,
                    validFrom,
                    BigDecimal.ZERO,
                    null,
                    null,
                    CatalogueSource.FACTURE,
                    ligne.getId(),
                    null,
                    true);
        }
    }

    /**
     * T9.4bis — à la signature, ouvre les lignes catalogue déjà rattachées au contrat-cadre
     * ({@code source=CONTRAT}, {@code sourceRefId=contratId}). Sans lignes : no-op silencieux.
     * Ne crée pas de lignes article sur {@link ContratFournisseur}.
     */
    @Transactional
    public void fromContratSigne(ContratFournisseur contrat) {
        if (contrat == null || contrat.getId() == null || contrat.getTenantId() == null) {
            return;
        }
        List<CatalogueFournisseurLigne> lignes = catalogueRepository.findByTenantIdAndSourceAndSourceRefId(
                contrat.getTenantId(), CatalogueSource.CONTRAT, contrat.getId());
        if (lignes.isEmpty()) {
            return;
        }
        for (CatalogueFournisseurLigne ligne : lignes) {
            ligne.setValidFrom(contrat.getDateDebut());
            ligne.setValidTo(contrat.getDateFin());
            ligne.setActif(true);
            ligne.setUpdatedAt(OffsetDateTime.now());
            catalogueRepository.save(ligne);
        }
        log.debug(
                "achats.catalogue.alimentation.contrat_ouvert contratId={} tenantId={} lignes={}",
                contrat.getId(),
                contrat.getTenantId(),
                lignes.size());
    }

    private UUID pivotCurrencyId(UUID tenantId) {
        return currencyConversionService
                .findReferenceCurrency(tenantId)
                .map(Currency::getId)
                .orElse(null);
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
}
