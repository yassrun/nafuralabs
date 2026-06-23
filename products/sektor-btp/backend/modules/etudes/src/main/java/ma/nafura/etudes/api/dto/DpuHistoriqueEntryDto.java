package ma.nafura.etudes.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.ComposantDpu;

public record DpuHistoriqueEntryDto(
        UUID id,
        @JsonProperty("savedAt") OffsetDateTime savedAt,
        List<ComposantDpu> composants,
        @JsonProperty("fraisGenerauxPercent") BigDecimal fraisGenerauxPercent,
        @JsonProperty("margePercent") BigDecimal margePercent,
        @JsonProperty("prixVenteHt") BigDecimal prixVenteHt) {}
