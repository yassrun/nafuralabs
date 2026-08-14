package ma.nafura.catalogue.service.prix;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.service.CurrencyConversionService;
import ma.nafura.catalogue.domain.ouvrage.BasePrixChiffrage;
import ma.nafura.catalogue.domain.article.PriceType;
import ma.nafura.catalogue.domain.article.SourcePrix;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.domain.article.ItemPrice;
import ma.nafura.catalogue.repository.ItemPriceRepository;
import ma.nafura.catalogue.repository.ItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResolutionPrixServiceImpl implements ResolutionPrixService {

    private final ItemRepository itemRepository;
    private final ItemPriceRepository itemPriceRepository;
    private final PrixAchatExternePort prixAchatExternePort;
    private final CurrencyConversionService currencyConversionService;

    public ResolutionPrixServiceImpl(
            ItemRepository itemRepository,
            ItemPriceRepository itemPriceRepository,
            PrixAchatExternePort prixAchatExternePort,
            CurrencyConversionService currencyConversionService) {
        this.itemRepository = itemRepository;
        this.itemPriceRepository = itemPriceRepository;
        this.prixAchatExternePort = prixAchatExternePort;
        this.currencyConversionService = currencyConversionService;
    }

    @Override
    @Transactional(readOnly = true)
    public PrixResolu resoudrePrixAchat(UUID itemId, ContexteResolution ctx) {
        String base = BasePrixChiffrage.normalize(ctx.basePrixChiffrage());
        if (BasePrixChiffrage.MAX.equals(base)) {
            return resolveMax(itemId, ctx);
        }
        List<String> order = hierarchy(base);
        for (String source : order) {
            Optional<PrixResolu> hit = resolveSource(itemId, ctx, source);
            if (hit.isPresent() && hit.get().prixUnitaire() != null) {
                return convertIfNeeded(hit.get(), ctx);
            }
        }
        return manuel();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrixResolu> toutesLesSources(UUID itemId, ContexteResolution ctx) {
        List<PrixResolu> out = new ArrayList<>();
        for (String source : hierarchy(BasePrixChiffrage.MARCHE)) {
            resolveSource(itemId, ctx, source).ifPresent(p -> out.add(convertIfNeeded(p, ctx)));
        }
        prixAchatExternePort.allSources(itemId, ctx).stream()
                .map(PrixCandidat::toResolu)
                .map(p -> convertIfNeeded(p, ctx))
                .forEach(p -> {
                    boolean already = out.stream()
                            .anyMatch(existing ->
                                    existing.sourcePrix().equals(p.sourcePrix())
                                            && equalRef(existing.sourceRefId(), p.sourceRefId()));
                    if (!already) {
                        out.add(p);
                    }
                });
        out.sort(Comparator.comparing(PrixResolu::sourcePrix));
        return out;
    }

    private PrixResolu resolveMax(UUID itemId, ContexteResolution ctx) {
        PrixResolu marche = resoudreAvecHierarchie(itemId, ctx, hierarchy(BasePrixChiffrage.MARCHE));
        Optional<PrixResolu> pmp = resolveSource(itemId, ctx, SourcePrix.PMP).map(p -> convertIfNeeded(p, ctx));
        if (pmp.isEmpty() || pmp.get().prixUnitaire() == null) {
            return marche;
        }
        if (marche.prixUnitaire() == null || SourcePrix.MANUEL.equals(marche.sourcePrix())) {
            return pmp.get();
        }
        return marche.prixUnitaire().compareTo(pmp.get().prixUnitaire()) >= 0 ? marche : pmp.get();
    }

    private PrixResolu resoudreAvecHierarchie(UUID itemId, ContexteResolution ctx, List<String> order) {
        for (String source : order) {
            Optional<PrixResolu> hit = resolveSource(itemId, ctx, source);
            if (hit.isPresent() && hit.get().prixUnitaire() != null) {
                return convertIfNeeded(hit.get(), ctx);
            }
        }
        return manuel();
    }

    private List<String> hierarchy(String base) {
        if (BasePrixChiffrage.PMP.equals(base)) {
            return List.of(
                    SourcePrix.CONSULTE,
                    SourcePrix.PMP,
                    SourcePrix.CONTRAT,
                    SourcePrix.CATALOGUE,
                    SourcePrix.TARIF,
                    SourcePrix.HISTORIQUE,
                    SourcePrix.MANUEL);
        }
        return List.of(
                SourcePrix.CONSULTE,
                SourcePrix.CONTRAT,
                SourcePrix.CATALOGUE,
                SourcePrix.TARIF,
                SourcePrix.HISTORIQUE,
                SourcePrix.PMP,
                SourcePrix.MANUEL);
    }

    private Optional<PrixResolu> resolveSource(UUID itemId, ContexteResolution ctx, String source) {
        return switch (source) {
            case SourcePrix.CONSULTE -> prixAchatExternePort.findOffreRetenue(itemId, ctx).map(PrixCandidat::toResolu);
            case SourcePrix.CONTRAT -> prixAchatExternePort.findContrat(itemId, ctx).map(PrixCandidat::toResolu);
            case SourcePrix.CATALOGUE -> prixAchatExternePort.findCatalogue(itemId, ctx).map(PrixCandidat::toResolu);
            case SourcePrix.TARIF -> findTarif(itemId, ctx);
            case SourcePrix.HISTORIQUE ->
                    prixAchatExternePort.findDerniereFacture(itemId, ctx).map(PrixCandidat::toResolu);
            case SourcePrix.PMP -> findPmp(itemId, ctx);
            case SourcePrix.MANUEL -> Optional.of(manuel());
            default -> Optional.empty();
        };
    }

    private Optional<PrixResolu> findTarif(UUID itemId, ContexteResolution ctx) {
        LocalDate date = ctx.dateReference();
        return itemPriceRepository
                .findEffective(
                        ctx.tenantId(), itemId, PriceType.ACHAT_STANDARD, date)
                .stream()
                .findFirst()
                .map(price -> new PrixResolu(
                        price.getUnitPrice(),
                        SourcePrix.TARIF,
                        price.getId(),
                        price.getEffectiveFrom(),
                        price.getCurrencyId(),
                        "Tarif ACHAT_STANDARD — " + price.getEffectiveFrom(),
                        isPerime(price.getEffectiveTo(), date)));
    }

    private Optional<PrixResolu> findPmp(UUID itemId, ContexteResolution ctx) {
        return itemRepository
                .findByIdAndTenantId(itemId, ctx.tenantId())
                .map(Item::getPmp)
                .filter(pmp -> pmp != null && pmp.compareTo(BigDecimal.ZERO) > 0)
                .map(pmp -> new PrixResolu(
                        pmp,
                        SourcePrix.PMP,
                        itemId,
                        ctx.dateReference(),
                        ctx.devisePivotId(),
                        "PMP stock",
                        false));
    }

    private PrixResolu convertIfNeeded(PrixResolu prix, ContexteResolution ctx) {
        if (prix.prixUnitaire() == null || ctx.devisePivotId() == null || prix.currencyId() == null) {
            return prix;
        }
        if (ctx.devisePivotId().equals(prix.currencyId())) {
            return prix;
        }
        BigDecimal converted = currencyConversionService.convert(
                ctx.tenantId(),
                prix.currencyId(),
                ctx.devisePivotId(),
                prix.prixUnitaire(),
                ctx.dateReference());
        return new PrixResolu(
                converted.setScale(4, RoundingMode.HALF_UP),
                prix.sourcePrix(),
                prix.sourceRefId(),
                prix.dateSource(),
                ctx.devisePivotId(),
                prix.libelleSource() + " (converti)",
                prix.perime());
    }

    private static boolean isPerime(LocalDate effectiveTo, LocalDate dateReference) {
        return effectiveTo != null && effectiveTo.isBefore(dateReference);
    }

    private static boolean equalRef(UUID a, UUID b) {
        if (a == null && b == null) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        return a.equals(b);
    }

    private static PrixResolu manuel() {
        return new PrixResolu(null, SourcePrix.MANUEL, null, null, null, "Saisie manuelle requise", false);
    }
}
