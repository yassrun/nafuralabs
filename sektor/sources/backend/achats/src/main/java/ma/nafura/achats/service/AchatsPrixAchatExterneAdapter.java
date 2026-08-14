package ma.nafura.achats.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.CatalogueSource;
import ma.nafura.achats.domain.model.AppelOffreAchat;
import ma.nafura.achats.domain.model.AppelOffreLigne;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.achats.domain.model.FactureFournisseur;
import ma.nafura.achats.domain.model.FactureFournisseurLigne;
import ma.nafura.achats.domain.model.OffreFournisseur;
import ma.nafura.achats.domain.model.OffreFournisseurLigne;
import ma.nafura.achats.repository.AppelOffreAchatRepository;
import ma.nafura.achats.repository.CatalogueFournisseurLigneRepository;
import ma.nafura.achats.repository.FactureFournisseurRepository;
import ma.nafura.catalogue.domain.SourcePrix;
import ma.nafura.catalogue.service.prix.ContexteResolution;
import ma.nafura.catalogue.service.prix.PrixAchatExternePort;
import ma.nafura.catalogue.service.prix.PrixCandidat;
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

    public AchatsPrixAchatExterneAdapter(
            CatalogueFournisseurLigneRepository catalogueRepository,
            AppelOffreAchatRepository appelOffreRepository,
            FactureFournisseurRepository factureRepository,
            BonCommandeAchatService bonCommandeAchatService) {
        this.catalogueRepository = catalogueRepository;
        this.appelOffreRepository = appelOffreRepository;
        this.factureRepository = factureRepository;
        this.bonCommandeAchatService = bonCommandeAchatService;
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
        return new PrixCandidat(
                row.prixNetHt(),
                sourcePrix,
                row.getId(),
                row.getValidFrom(),
                row.getCurrencyId(),
                labelPrefix(row) + " — " + row.getValidFrom(),
                row.isPerimeAt(date));
    }

    private static String labelPrefix(CatalogueFournisseurLigne row) {
        return "Catalogue " + (row.getFournisseurId() != null ? row.getFournisseurId().toString() : "");
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
