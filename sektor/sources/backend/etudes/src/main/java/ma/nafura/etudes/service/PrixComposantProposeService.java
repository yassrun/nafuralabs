package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.api.CatalogCandidate;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.catalogue.api.CatalogNatureMapping;
import ma.nafura.catalogue.api.CatalogPriceContext;
import ma.nafura.catalogue.api.CatalogPriceSnapshot;
import ma.nafura.catalogue.api.CatalogPriceSource;
import ma.nafura.etudes.api.dto.PrixComposantProposeDto;
import ma.nafura.etudes.api.request.PrixComposantProposeRequest;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.service.port.capability.PrixComposantProposePort;
import ma.nafura.etudes.service.port.capability.PrixComposantProposePort.Contexte;
import ma.nafura.etudes.service.port.capability.PrixComposantProposePort.Estimation;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Propose un PU : catalogue interne d'abord, sinon estimation IA (à vérifier).
 * Jamais persisté tant que le chargé n'enregistre pas le composant.
 */
@Service
public class PrixComposantProposeService {

    private static final double SCORE_CATALOGUE_MIN = 0.8;

    private final DossierEtudeRepository dossierRepository;
    private final CatalogLookupApi catalogLookupApi;
    private final PrixComposantProposePort estimationPort;

    public PrixComposantProposeService(
            DossierEtudeRepository dossierRepository,
            CatalogLookupApi catalogLookupApi,
            PrixComposantProposePort estimationPort) {
        this.dossierRepository = dossierRepository;
        this.catalogLookupApi = catalogLookupApi;
        this.estimationPort = estimationPort;
    }

    @Transactional(readOnly = true)
    public Optional<PrixComposantProposeDto> proposer(UUID dossierId, PrixComposantProposeRequest request) {
        if (request == null || !StringUtils.hasText(request.getDesignation())) {
            throw new IllegalArgumentException("etudes.prix.designation_requise");
        }
        DossierEtude dossier = dossierRepository
                .findByIdAndTenantId(dossierId, TenantContext.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));

        String designation = request.getDesignation().trim();
        String type = StringUtils.hasText(request.getType()) ? request.getType().trim() : "MATIERE";
        String unite = StringUtils.hasText(request.getUnite()) ? request.getUnite().trim() : "U";

        Optional<PrixComposantProposeDto> catalogue = depuisCatalogue(designation, type, unite);
        if (catalogue.isPresent()) {
            return catalogue;
        }

        if (!estimationPort.isAvailable()) {
            return Optional.empty();
        }
        Contexte ctx = new Contexte(
                designation,
                type,
                unite,
                trimToNull(request.getArticleLibelle()),
                trimToNull(request.getArticleCode()),
                trimToNull(dossier.getObjet()),
                trimToNull(dossier.getAoVille()),
                trimToNull(dossier.getAoType()));
        return estimationPort.estimer(ctx).map(PrixComposantProposeService::depuisEstimation);
    }

    private Optional<PrixComposantProposeDto> depuisCatalogue(String designation, String type, String unite) {
        String nature = natureDepuisTypeDpu(type);
        List<CatalogCandidate> hits = catalogLookupApi.lookup(designation, nature, 8);
        if (hits == null || hits.isEmpty()) {
            hits = catalogLookupApi.lookup(designation, null, 8);
        }
        if (hits == null || hits.isEmpty()) {
            return Optional.empty();
        }
        CatalogCandidate best = hits.stream()
                .max(Comparator.comparingDouble(c -> c.score() != null ? c.score() : 0))
                .orElse(null);
        if (best == null || best.score() == null || best.score() < SCORE_CATALOGUE_MIN) {
            return Optional.empty();
        }
        UUID itemId;
        try {
            itemId = UUID.fromString(best.itemId());
        } catch (RuntimeException ex) {
            return Optional.empty();
        }
        CatalogPriceSnapshot prix = catalogLookupApi.resolvePurchasePrice(
                itemId, new CatalogPriceContext(LocalDate.now(), null, null, null, null));
        if (prix == null || prix.unitPrice() == null || prix.unitPrice().signum() <= 0) {
            return Optional.empty();
        }
        String source = StringUtils.hasText(prix.priceSource()) ? prix.priceSource() : CatalogPriceSource.CATALOGUE;
        String libelle = StringUtils.hasText(prix.sourceLabel())
                ? prix.sourceLabel()
                : (best.code() != null ? best.code() + " — " + best.name() : best.name());
        String resolvedUnite = StringUtils.hasText(best.unite()) ? best.unite() : unite;
        return Optional.of(PrixComposantProposeDto.builder()
                .prixUnitaire(prix.unitPrice())
                .unite(resolvedUnite)
                .sourcePrix(source)
                .libelleSource(libelle)
                .confiance(best.score())
                .aVerifier(false)
                .justification("Prix catalogue interne")
                .build());
    }

    private static PrixComposantProposeDto depuisEstimation(Estimation est) {
        return PrixComposantProposeDto.builder()
                .prixUnitaire(est.prixUnitaire())
                .unite(est.unite())
                .sourcePrix("ESTIME")
                .libelleSource("Estimation IA · marché MA")
                .confiance(est.confiance())
                .aVerifier(true)
                .justification(StringUtils.hasText(est.justification())
                        ? est.justification()
                        : "Ordre de grandeur marché Maroc — à vérifier")
                .build();
    }

    private static String natureDepuisTypeDpu(String type) {
        if (!StringUtils.hasText(type)) {
            return "MATIERE";
        }
        return switch (type.trim().toUpperCase()) {
            case CatalogNatureMapping.DPU_MAIN_DOEUVRE -> "MAIN_DOEUVRE";
            case CatalogNatureMapping.DPU_MATERIEL -> "MATERIEL";
            case CatalogNatureMapping.DPU_SOUS_TRAITANCE -> "SOUS_TRAITANCE";
            default -> "MATIERE";
        };
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
