package ma.nafura.stock.api.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record MagasinChantierDto(
        String chantierId,
        String chantierLabel,
        UUID depotChantierId,
        String depotCode,
        String depotName,
        List<MagasinStockArticleDto> stockArticles,
        List<MagasinMouvementDto> derniersMouvements,
        BigDecimal totalValorisation) {}
