package ma.nafura.etudes.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.api.CatalogCandidate;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.catalogue.api.CatalogNatureMapping;
import ma.nafura.catalogue.api.CatalogPriceContext;
import ma.nafura.catalogue.api.CatalogPriceHistoryEntry;
import ma.nafura.etudes.api.dto.HistoriquePrixComposantDto;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Historique de prix d'un composant : achats (factures / commandes) puis consultations.
 * Jamais persisté — le chiffreur choisit une ligne.
 */
@Service
public class HistoriquePrixComposantService {

    private static final double SCORE_AUTO_LIEN = 0.8;

    private final DossierEtudeRepository dossierRepository;
    private final CatalogLookupApi catalogLookupApi;

    public HistoriquePrixComposantService(
            DossierEtudeRepository dossierRepository, CatalogLookupApi catalogLookupApi) {
        this.dossierRepository = dossierRepository;
        this.catalogLookupApi = catalogLookupApi;
    }

    @Transactional(readOnly = true)
    public HistoriquePrixComposantDto historique(
            UUID dossierId, UUID itemId, String designation, String type) {
        dossierRepository
                .findByIdAndTenantId(dossierId, TenantContext.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));

        CatalogItemSnapshot item = null;
        List<CatalogCandidate> suggestions = List.of();

        if (itemId != null) {
            item = catalogLookupApi.getItem(itemId).orElse(null);
        } else if (StringUtils.hasText(designation)) {
            String nature = natureDepuisTypeDpu(type);
            List<CatalogCandidate> hits = catalogLookupApi.lookup(designation.trim(), nature, 8);
            if (hits == null || hits.isEmpty()) {
                hits = catalogLookupApi.lookup(designation.trim(), null, 8);
            }
            suggestions = hits != null ? hits : List.of();
            CatalogCandidate best = suggestions.stream()
                    .filter(c -> c.score() != null && c.score() >= SCORE_AUTO_LIEN)
                    .max(Comparator.comparingDouble(CatalogCandidate::score))
                    .orElse(null);
            if (best != null && StringUtils.hasText(best.itemId())) {
                try {
                    item = catalogLookupApi.getItem(UUID.fromString(best.itemId())).orElse(null);
                } catch (RuntimeException ignored) {
                    item = null;
                }
            }
        }

        if (item == null || !StringUtils.hasText(item.itemId())) {
            return new HistoriquePrixComposantDto(null, suggestions, List.of());
        }

        UUID resolvedId;
        try {
            resolvedId = UUID.fromString(item.itemId());
        } catch (RuntimeException ex) {
            return new HistoriquePrixComposantDto(item, suggestions, List.of());
        }

        List<CatalogPriceHistoryEntry> raw = catalogLookupApi.listPurchasePriceHistory(
                resolvedId, new CatalogPriceContext(LocalDate.now(), null, null, null, null));
        List<HistoriquePrixComposantDto.Ligne> lignes = new ArrayList<>();
        if (raw != null) {
            for (CatalogPriceHistoryEntry row : raw) {
                if (row == null || row.unitPrice() == null || row.unitPrice().signum() <= 0) {
                    continue;
                }
                lignes.add(new HistoriquePrixComposantDto.Ligne(
                        row.kind(),
                        row.detail(),
                        row.priceSource(),
                        row.unitPrice(),
                        row.sourceDate(),
                        row.sourceRefId(),
                        row.sourceLabel(),
                        row.supplierName(),
                        row.expired()));
            }
        }
        lignes.sort(Comparator.comparingInt(HistoriquePrixComposantService::rank)
                .thenComparing(HistoriquePrixComposantDto.Ligne::dateSource, Comparator.nullsLast(Comparator.reverseOrder())));
        return new HistoriquePrixComposantDto(item, suggestions, lignes);
    }

    private static int rank(HistoriquePrixComposantDto.Ligne ligne) {
        String kind = ligne.kind() != null ? ligne.kind() : "";
        String detail = ligne.detail() != null ? ligne.detail() : "";
        if (CatalogPriceHistoryEntry.KIND_ACHATS.equals(kind)) {
            return CatalogPriceHistoryEntry.DETAIL_FACTURE.equals(detail) ? 0 : 1;
        }
        if (CatalogPriceHistoryEntry.KIND_CONSULTATION.equals(kind)) {
            return 2;
        }
        if (CatalogPriceHistoryEntry.KIND_CATALOGUE.equals(kind)) {
            return 3;
        }
        return 4;
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
}
