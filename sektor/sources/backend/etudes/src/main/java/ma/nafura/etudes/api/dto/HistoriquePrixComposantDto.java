package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.api.CatalogCandidate;
import ma.nafura.catalogue.api.CatalogItemSnapshot;

public record HistoriquePrixComposantDto(
        CatalogItemSnapshot item,
        List<CatalogCandidate> suggestions,
        List<Ligne> lignes) {

    public record Ligne(
            String kind,
            String detail,
            String sourcePrix,
            BigDecimal prixUnitaire,
            LocalDate dateSource,
            UUID sourceRefId,
            String libelle,
            String fournisseur,
            boolean perime) {}

    public HistoriquePrixComposantDto {
        suggestions = suggestions != null ? List.copyOf(suggestions) : List.of();
        lignes = lignes != null ? List.copyOf(lignes) : List.of();
    }
}
