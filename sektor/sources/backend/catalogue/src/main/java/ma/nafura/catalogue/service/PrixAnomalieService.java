package ma.nafura.catalogue.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.domain.article.ItemPrice;
import ma.nafura.catalogue.domain.ouvrage.CatalogPrixReference;
import ma.nafura.catalogue.repository.CatalogPrixReferenceRepository;
import ma.nafura.catalogue.repository.ItemPriceRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Détection de prix anormal (L16 / L16b).
 * Priorité : moyenne tenant 6 mois ; fallback : refs catalogue.
 */
@Service
public class PrixAnomalieService {

    public static final double SEUIL_ECART = 0.18;

    private final CatalogPrixReferenceRepository prixRepository;
    private final ItemPriceRepository itemPriceRepository;

    public PrixAnomalieService(
            CatalogPrixReferenceRepository prixRepository, ItemPriceRepository itemPriceRepository) {
        this.prixRepository = prixRepository;
        this.itemPriceRepository = itemPriceRepository;
    }

    public record AnomaliePrix(
            boolean anormal,
            BigDecimal prixSaisi,
            BigDecimal moyenneReference,
            double ecartRelatif,
            String source, // TENANT | CATALOGUE
            String messageKey) {}

    /** Spec : « 18 % au-dessus de votre moyenne des 6 derniers mois ». */
    public Optional<AnomaliePrix> evaluerTenant(UUID itemId, BigDecimal prixSaisi) {
        if (itemId == null || prixSaisi == null) {
            return Optional.empty();
        }
        return moyenneTenant6Mois(itemId)
                .flatMap(moyenne -> fromMoyenne(prixSaisi, moyenne, "TENANT", "catalogue.prix.anormal_au_dessus_tenant"));
    }

    private Optional<BigDecimal> moyenneTenant6Mois(UUID itemId) {
        UUID tenantId = TenantContext.getTenantIdOrNull();
        if (tenantId == null) {
            return Optional.empty();
        }
        LocalDate from = LocalDate.now().minusMonths(6);
        List<ItemPrice> rows = itemPriceRepository.findSince(tenantId, itemId, from);
        if (rows == null || rows.isEmpty()) {
            return Optional.empty();
        }
        BigDecimal sum = BigDecimal.ZERO;
        int n = 0;
        for (ItemPrice p : rows) {
            if (p.getUnitPrice() != null && p.getUnitPrice().signum() > 0) {
                sum = sum.add(p.getUnitPrice());
                n++;
            }
        }
        if (n == 0) {
            return Optional.empty();
        }
        return Optional.of(sum.divide(BigDecimal.valueOf(n), 4, RoundingMode.HALF_UP));
    }

    public Optional<AnomaliePrix> evaluer(String catalogArticleCle, BigDecimal prixSaisi) {
        if (!StringUtils.hasText(catalogArticleCle) || prixSaisi == null) {
            return Optional.empty();
        }
        LocalDate cutoff = LocalDate.now().minusMonths(6);
        List<CatalogPrixReference> refs =
                prixRepository.findByCatalogArticleCleOrderByValidFromDesc(catalogArticleCle.trim());
        List<BigDecimal> prix = refs.stream()
                .filter(r -> r.getValidFrom() == null || !r.getValidFrom().isBefore(cutoff))
                .filter(r -> r.getValidTo() == null || !r.getValidTo().isBefore(LocalDate.now()))
                .map(CatalogPrixReference::getPrix)
                .filter(p -> p != null && p.signum() > 0)
                .toList();
        if (prix.isEmpty()) {
            prix = refs.stream()
                    .map(CatalogPrixReference::getPrix)
                    .filter(p -> p != null && p.signum() > 0)
                    .toList();
        }
        if (prix.isEmpty()) {
            return Optional.empty();
        }
        BigDecimal sum = prix.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal moyenne = sum.divide(BigDecimal.valueOf(prix.size()), 4, RoundingMode.HALF_UP);
        return fromMoyenne(prixSaisi, moyenne, "CATALOGUE", "catalogue.prix.anormal_au_dessus");
    }

    /**
     * Tenant d'abord, sinon catalogue (si cle fournie).
     */
    public Optional<AnomaliePrix> evaluer(
            UUID itemId, String catalogArticleCle, BigDecimal prixSaisi) {
        Optional<AnomaliePrix> tenant = evaluerTenant(itemId, prixSaisi);
        if (tenant.isPresent()) {
            return tenant;
        }
        return evaluer(catalogArticleCle, prixSaisi);
    }

    private Optional<AnomaliePrix> fromMoyenne(
            BigDecimal prixSaisi, BigDecimal moyenne, String source, String msgAnormal) {
        if (moyenne == null || moyenne.signum() <= 0) {
            return Optional.empty();
        }
        double ecart = prixSaisi.subtract(moyenne)
                .divide(moyenne, 6, RoundingMode.HALF_UP)
                .doubleValue();
        boolean anormal = ecart > SEUIL_ECART;
        return Optional.of(new AnomaliePrix(
                anormal,
                prixSaisi,
                moyenne,
                ecart,
                source,
                anormal ? msgAnormal : "catalogue.prix.dans_norme"));
    }

    public Optional<CatalogPrixReference> derniereRef(String catalogArticleCle) {
        return prixRepository.findByCatalogArticleCleOrderByValidFromDesc(catalogArticleCle).stream()
                .max(Comparator.comparing(
                        CatalogPrixReference::getValidFrom, Comparator.nullsLast(Comparator.naturalOrder())));
    }
}
