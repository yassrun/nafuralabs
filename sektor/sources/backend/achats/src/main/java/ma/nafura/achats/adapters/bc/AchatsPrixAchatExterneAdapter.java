package ma.nafura.achats.adapters.bc;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.contrat.CatalogueSource;
import ma.nafura.achats.domain.appeloffre.AppelOffreAchat;
import ma.nafura.achats.domain.appeloffre.AppelOffreLigne;
import ma.nafura.achats.domain.contrat.CatalogueFournisseurLigne;
import ma.nafura.achats.domain.facture.FactureFournisseur;
import ma.nafura.achats.domain.facture.FactureFournisseurLigne;
import ma.nafura.achats.domain.appeloffre.OffreFournisseur;
import ma.nafura.achats.domain.appeloffre.OffreFournisseurLigne;
import ma.nafura.achats.domain.commande.BonCommandeAchat;
import ma.nafura.achats.domain.commande.BonCommandeAchatLigne;
import ma.nafura.achats.domain.consultation.ConsultationAchat;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevis;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevisLigne;
import ma.nafura.achats.domain.consultation.ConsultationAchatDestinataire;
import ma.nafura.achats.domain.fournisseur.Partner;
import ma.nafura.achats.repository.AppelOffreAchatRepository;
import ma.nafura.achats.repository.BonCommandeAchatRepository;
import ma.nafura.achats.repository.CatalogueFournisseurLigneRepository;
import ma.nafura.achats.repository.ConsultationAchatDevisRepository;
import ma.nafura.achats.repository.ConsultationAchatDestinataireRepository;
import ma.nafura.achats.repository.ConsultationAchatRepository;
import ma.nafura.achats.repository.FactureFournisseurRepository;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.catalogue.api.CatalogPriceHistoryEntry;
import ma.nafura.catalogue.domain.article.SourcePrix;
import ma.nafura.catalogue.service.prix.ContexteResolution;
import ma.nafura.catalogue.service.port.bc.PrixAchatExternePort;
import ma.nafura.catalogue.service.prix.PrixCandidat;
import ma.nafura.achats.service.BonCommandeAchatService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Adapte les sources achats vers {@link PrixAchatExternePort} (lot 9 T9.5).
 */
@Component
@Primary
public class AchatsPrixAchatExterneAdapter implements PrixAchatExternePort {

    private final CatalogueFournisseurLigneRepository catalogueRepository;
    private final AppelOffreAchatRepository appelOffreRepository;
    private final FactureFournisseurRepository factureRepository;
    private final BonCommandeAchatService bonCommandeAchatService;
    private final BonCommandeAchatRepository bonCommandeRepository;
    private final ConsultationAchatRepository consultationRepository;
    private final ConsultationAchatDevisRepository devisRepository;
    private final ConsultationAchatDestinataireRepository destinataireRepository;
    private final PartnerRepository partnerRepository;

    public AchatsPrixAchatExterneAdapter(
            CatalogueFournisseurLigneRepository catalogueRepository,
            AppelOffreAchatRepository appelOffreRepository,
            FactureFournisseurRepository factureRepository,
            BonCommandeAchatService bonCommandeAchatService,
            BonCommandeAchatRepository bonCommandeRepository,
            ConsultationAchatRepository consultationRepository,
            ConsultationAchatDevisRepository devisRepository,
            ConsultationAchatDestinataireRepository destinataireRepository,
            PartnerRepository partnerRepository) {
        this.catalogueRepository = catalogueRepository;
        this.appelOffreRepository = appelOffreRepository;
        this.factureRepository = factureRepository;
        this.bonCommandeAchatService = bonCommandeAchatService;
        this.bonCommandeRepository = bonCommandeRepository;
        this.consultationRepository = consultationRepository;
        this.devisRepository = devisRepository;
        this.destinataireRepository = destinataireRepository;
        this.partnerRepository = partnerRepository;
    }

    @Override
    public Optional<PrixCandidat> findOffreRetenue(UUID itemId, ContexteResolution ctx) {
        String articleId = itemId.toString();
        LocalDate date = ctx.dateReference();
        String chantierFilter =
                ctx.chantierId() != null ? ctx.chantierId().toString() : null;

        List<AppelOffreAchat> aos = appelOffreRepository.findByTenantIdOrderByCreatedAtDesc(ctx.tenantId());
        PrixCandidat best = null;
        for (AppelOffreAchat ao : aos) {
            if (chantierFilter != null
                    && StringUtils.hasText(ao.getChantierId())
                    && !chantierFilter.equals(ao.getChantierId())) {
                continue;
            }
            if (ao.getReponses() == null) {
                continue;
            }
            for (OffreFournisseur offre : ao.getReponses()) {
                boolean retenue = offre.isRetenue()
                        || (AppelOffreAchat.STATUS_ATTRIBUEE.equals(ao.getStatus())
                                && offre.getFournisseurId() != null
                                && offre.getFournisseurId().equals(ao.getFournisseurAttribueId()));
                if (!retenue || offre.getLignes() == null) {
                    continue;
                }
                for (OffreFournisseurLigne ligne : offre.getLignes()) {
                    AppelOffreLigne aoLigne = ligne.getAppelOffreLigne();
                    if (aoLigne == null || !articleId.equals(aoLigne.getArticleId())) {
                        continue;
                    }
                    LocalDate dateSource =
                            offre.getDateReponse() != null ? offre.getDateReponse() : ao.getDatePublication();
                    if (dateSource != null && dateSource.isAfter(date)) {
                        continue;
                    }
                    PrixCandidat candidat = new PrixCandidat(
                            ligne.getPrixUnitaireHt(),
                            SourcePrix.CONSULTE,
                            ligne.getId(),
                            dateSource,
                            null,
                            "Offre retenue " + nullToEmpty(offre.getFournisseurName()) + " — "
                                    + (dateSource != null ? dateSource : ""),
                            false);
                    if (best == null
                            || (dateSource != null
                                    && best.dateSource() != null
                                    && dateSource.isAfter(best.dateSource()))) {
                        best = candidat;
                    }
                }
            }
        }
        return Optional.ofNullable(best);
    }

    @Override
    public Optional<PrixCandidat> findContrat(UUID itemId, ContexteResolution ctx) {
        return pickCatalogue(itemId, ctx, CatalogueSource.CONTRAT, SourcePrix.CONTRAT);
    }

    @Override
    public Optional<PrixCandidat> findCatalogue(UUID itemId, ContexteResolution ctx) {
        List<CatalogueFournisseurLigne> rows =
                catalogueRepository.findValidAt(ctx.tenantId(), itemId, ctx.dateReference());
        if (ctx.fournisseurPrefereId() != null) {
            UUID pref = ctx.fournisseurPrefereId();
            Optional<CatalogueFournisseurLigne> preferred = rows.stream()
                    .filter(r -> pref.equals(r.getFournisseurId()))
                    .findFirst();
            if (preferred.isPresent()) {
                return Optional.of(toCandidat(preferred.get(), SourcePrix.CATALOGUE, ctx.dateReference()));
            }
        }
        return rows.stream()
                .filter(r -> !CatalogueSource.CONTRAT.equals(r.getSource()))
                .findFirst()
                .map(r -> toCandidat(r, SourcePrix.CATALOGUE, ctx.dateReference()));
    }

    @Override
    public Optional<PrixCandidat> findDerniereFacture(UUID itemId, ContexteResolution ctx) {
        String articleId = itemId.toString();
        List<FactureFournisseur> factures =
                factureRepository.findByTenantIdOrderByDateFactureDesc(ctx.tenantId());
        for (FactureFournisseur facture : factures) {
            if (!FactureFournisseur.STATUS_VALIDEE.equals(facture.getStatus())
                    && !FactureFournisseur.STATUS_COMPTABILISEE.equals(facture.getStatus())
                    && !FactureFournisseur.STATUS_PARTIELLEMENT_PAYEE.equals(facture.getStatus())
                    && !FactureFournisseur.STATUS_PAYEE.equals(facture.getStatus())) {
                continue;
            }
            if (facture.getDateFacture() != null && facture.getDateFacture().isAfter(ctx.dateReference())) {
                continue;
            }
            if (facture.getLignes() == null || facture.getBcId() == null) {
                continue;
            }
            try {
                var bc = bonCommandeAchatService.getById(facture.getBcId());
                for (FactureFournisseurLigne ligne : facture.getLignes()) {
                    if (ligne.getBcLigneId() == null || ligne.getPrixUnitaireHt() == null) {
                        continue;
                    }
                    boolean match = bc.getLignes() != null
                            && bc.getLignes().stream()
                                    .anyMatch(bcLigne ->
                                            ligne.getBcLigneId().equals(bcLigne.getId())
                                                    && articleId.equals(bcLigne.getArticleId()));
                    if (match) {
                        return Optional.of(new PrixCandidat(
                                ligne.getPrixUnitaireHt(),
                                SourcePrix.HISTORIQUE,
                                ligne.getId(),
                                facture.getDateFacture(),
                                null,
                                "Facture " + nullToEmpty(facture.getNumeroInterne()) + " — "
                                        + facture.getDateFacture(),
                                false));
                    }
                }
            } catch (RuntimeException ignored) {
                // BC manquant
            }
        }
        return Optional.empty();
    }

    @Override
    public List<PrixCandidat> allSources(UUID itemId, ContexteResolution ctx) {
        List<PrixCandidat> out = new ArrayList<>();
        findOffreRetenue(itemId, ctx).ifPresent(out::add);
        findContrat(itemId, ctx).ifPresent(out::add);
        catalogueRepository.findValidAt(ctx.tenantId(), itemId, ctx.dateReference()).stream()
                .map(r -> toCandidat(r, SourcePrix.CATALOGUE, ctx.dateReference()))
                .forEach(out::add);
        findDerniereFacture(itemId, ctx).ifPresent(out::add);
        out.sort(Comparator.comparing(PrixCandidat::sourcePrix));
        return out;
    }

    @Override
    public List<PrixCandidat> listHistorique(UUID itemId, String cleStable, ContexteResolution ctx) {
        List<PrixCandidat> out = new ArrayList<>();
        collectConsultations(cleStable, ctx, out);
        collectCommandes(itemId, ctx, out);
        collectFactures(itemId, ctx, out);
        catalogueRepository.findValidAt(ctx.tenantId(), itemId, ctx.dateReference()).stream()
                .map(r -> toCandidat(r, SourcePrix.CATALOGUE, ctx.dateReference()))
                .forEach(out::add);
        findContrat(itemId, ctx).ifPresent(out::add);
        out.sort(Comparator.comparing(PrixCandidat::sourcePrix));
        return out;
    }

    private Optional<PrixCandidat> pickCatalogue(
            UUID itemId, ContexteResolution ctx, String catalogueSource, String sourcePrix) {
        List<CatalogueFournisseurLigne> rows = catalogueRepository.findValidAtBySource(
                ctx.tenantId(), itemId, catalogueSource, ctx.dateReference());
        if (ctx.fournisseurPrefereId() != null) {
            UUID pref = ctx.fournisseurPrefereId();
            Optional<CatalogueFournisseurLigne> preferred = rows.stream()
                    .filter(r -> pref.equals(r.getFournisseurId()))
                    .findFirst();
            if (preferred.isPresent()) {
                return Optional.of(toCandidat(preferred.get(), sourcePrix, ctx.dateReference()));
            }
        }
        return rows.stream().findFirst().map(r -> toCandidat(r, sourcePrix, ctx.dateReference()));
    }

    private PrixCandidat toCandidat(CatalogueFournisseurLigne row, String sourcePrix, LocalDate date) {
        String supplier = partnerName(row.getFournisseurId());
        String kind = SourcePrix.CONTRAT.equals(sourcePrix)
                ? CatalogPriceHistoryEntry.KIND_CATALOGUE
                : CatalogPriceHistoryEntry.KIND_CATALOGUE;
        String detail = SourcePrix.CONTRAT.equals(sourcePrix)
                ? CatalogPriceHistoryEntry.DETAIL_CONTRAT
                : CatalogPriceHistoryEntry.DETAIL_CATALOGUE;
        String label = (SourcePrix.CONTRAT.equals(sourcePrix) ? "Contrat · " : "Catalogue · ")
                + supplier
                + " — "
                + row.getValidFrom();
        return new PrixCandidat(
                row.prixNetHt(),
                sourcePrix,
                row.getId(),
                row.getValidFrom(),
                row.getCurrencyId(),
                label,
                row.isPerimeAt(date),
                kind,
                detail,
                supplier);
    }

    private void collectConsultations(String cleStable, ContexteResolution ctx, List<PrixCandidat> out) {
        if (!StringUtils.hasText(cleStable)) {
            return;
        }
        String cle = cleStable.trim().toLowerCase(Locale.ROOT);
        List<ConsultationAchat> rows =
                consultationRepository.findByTenantIdOrderByCreatedAtDesc(ctx.tenantId());
        if (rows == null || rows.isEmpty()) {
            return;
        }
        List<UUID> ids = rows.stream().map(ConsultationAchat::getId).filter(id -> id != null).toList();
        if (ids.isEmpty()) {
            return;
        }
        Map<UUID, ConsultationAchat> byId = new HashMap<>();
        for (ConsultationAchat row : rows) {
            if (row.getId() != null) {
                byId.put(row.getId(), row);
            }
        }
        Map<UUID, ConsultationAchatDestinataire> destById = new HashMap<>();
        for (ConsultationAchatDestinataire dest :
                destinataireRepository.findByConsultationIdInOrderByCreatedAtAsc(ids)) {
            destById.put(dest.getId(), dest);
        }
        for (ConsultationAchatDevis devis : devisRepository.findByConsultationIdIn(ids)) {
            if (devis.getLignes() == null) {
                continue;
            }
            ConsultationAchat consultation = byId.get(devis.getConsultationId());
            ConsultationAchatDestinataire dest = destById.get(devis.getDestinataireId());
            String supplier = dest != null ? partnerName(dest.getFournisseurId()) : "";
            LocalDate date = devis.getCreatedAt() != null ? devis.getCreatedAt().toLocalDate() : ctx.dateReference();
            String numero = consultation != null ? nullToEmpty(consultation.getNumero()) : "";
            for (ConsultationAchatDevisLigne ligne : devis.getLignes()) {
                if (ligne == null || ligne.getPrixUnitaire() == null || !cle.equals(normalizeCle(ligne.getIdentite()))) {
                    continue;
                }
                String label = "Consultation · " + numero + " · " + supplier;
                out.add(new PrixCandidat(
                        ligne.getPrixUnitaire(),
                        SourcePrix.CONSULTE,
                        devis.getId(),
                        date,
                        null,
                        label,
                        false,
                        CatalogPriceHistoryEntry.KIND_CONSULTATION,
                        CatalogPriceHistoryEntry.DETAIL_DEVIS,
                        supplier));
            }
        }
    }

    private void collectCommandes(UUID itemId, ContexteResolution ctx, List<PrixCandidat> out) {
        String articleId = itemId.toString();
        for (BonCommandeAchat bc : bonCommandeRepository.findByTenantIdOrderByCreatedAtDesc(ctx.tenantId())) {
            if (bc.getLignes() == null) {
                continue;
            }
            if (BonCommandeAchat.STATUS_BROUILLON.equals(bc.getStatus())
                    || BonCommandeAchat.STATUS_ANNULE.equals(bc.getStatus())) {
                continue;
            }
            LocalDate date = bc.getDateCreation() != null ? bc.getDateCreation() : ctx.dateReference();
            if (date != null && date.isAfter(ctx.dateReference())) {
                continue;
            }
            for (BonCommandeAchatLigne ligne : bc.getLignes()) {
                if (ligne == null || ligne.getPrixUnitaireHt() == null || !articleId.equals(ligne.getArticleId())) {
                    continue;
                }
                String supplier = StringUtils.hasText(bc.getFournisseurName())
                        ? bc.getFournisseurName()
                        : partnerName(parseUuid(bc.getFournisseurId()));
                String label = "Commande · " + nullToEmpty(bc.getNumero()) + " · " + supplier;
                out.add(new PrixCandidat(
                        ligne.getPrixUnitaireHt(),
                        SourcePrix.HISTORIQUE,
                        ligne.getId(),
                        date,
                        null,
                        label,
                        false,
                        CatalogPriceHistoryEntry.KIND_ACHATS,
                        CatalogPriceHistoryEntry.DETAIL_COMMANDE,
                        supplier));
            }
        }
    }

    private void collectFactures(UUID itemId, ContexteResolution ctx, List<PrixCandidat> out) {
        String articleId = itemId.toString();
        List<FactureFournisseur> factures =
                factureRepository.findByTenantIdOrderByDateFactureDesc(ctx.tenantId());
        for (FactureFournisseur facture : factures) {
            if (!FactureFournisseur.STATUS_VALIDEE.equals(facture.getStatus())
                    && !FactureFournisseur.STATUS_COMPTABILISEE.equals(facture.getStatus())
                    && !FactureFournisseur.STATUS_PARTIELLEMENT_PAYEE.equals(facture.getStatus())
                    && !FactureFournisseur.STATUS_PAYEE.equals(facture.getStatus())) {
                continue;
            }
            if (facture.getDateFacture() != null && facture.getDateFacture().isAfter(ctx.dateReference())) {
                continue;
            }
            if (facture.getLignes() == null || facture.getBcId() == null) {
                continue;
            }
            try {
                var bc = bonCommandeAchatService.getById(facture.getBcId());
                for (FactureFournisseurLigne ligne : facture.getLignes()) {
                    if (ligne.getBcLigneId() == null || ligne.getPrixUnitaireHt() == null) {
                        continue;
                    }
                    boolean match = bc.getLignes() != null
                            && bc.getLignes().stream()
                                    .anyMatch(bcLigne ->
                                            ligne.getBcLigneId().equals(bcLigne.getId())
                                                    && articleId.equals(bcLigne.getArticleId()));
                    if (match) {
                        String supplier = StringUtils.hasText(facture.getFournisseurName())
                                ? facture.getFournisseurName()
                                : partnerName(parseUuid(facture.getFournisseurId()));
                        String label = "Achat facturé · "
                                + nullToEmpty(facture.getNumeroInterne())
                                + " · "
                                + supplier;
                        out.add(new PrixCandidat(
                                ligne.getPrixUnitaireHt(),
                                SourcePrix.HISTORIQUE,
                                ligne.getId(),
                                facture.getDateFacture(),
                                null,
                                label,
                                false,
                                CatalogPriceHistoryEntry.KIND_ACHATS,
                                CatalogPriceHistoryEntry.DETAIL_FACTURE,
                                supplier));
                    }
                }
            } catch (RuntimeException ignored) {
                // BC manquant
            }
        }
    }

    private String partnerName(UUID partnerId) {
        if (partnerId == null) {
            return "";
        }
        return partnerRepository
                .findByIdAndTenantId(partnerId, TenantContext.getTenantId())
                .map(Partner::getRaisonSociale)
                .filter(StringUtils::hasText)
                .orElse(partnerId.toString());
    }

    private static UUID parseUuid(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private static String normalizeCle(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return raw.trim().toLowerCase(Locale.ROOT);
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
