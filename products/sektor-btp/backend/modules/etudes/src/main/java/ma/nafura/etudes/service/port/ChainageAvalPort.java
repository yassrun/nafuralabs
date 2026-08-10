package ma.nafura.etudes.service.port;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Port L13 — création atomique chantier + marché + budget hors module etudes.
 * Implémenté dans {@code backend/app} ; NoOp pour tests module.
 */
public interface ChainageAvalPort {

    ConversionResult convert(ConversionCommand command);

    record ConversionCommand(
            UUID dossierId,
            String clientId,
            String clientName,
            String objet,
            String chantierLabel,
            String chantierCode,
            String chantierVille,
            LocalDate dateDemarrage,
            Integer dureeMois,
            String marcheIntitule,
            String marcheReference,
            BigDecimal montantHt,
            BigDecimal tauxTva,
            List<LotProjection> lots,
            List<BudgetRubrique> budget) {}

    record LotProjection(
            String code,
            String designation,
            String type,
            String parentCode,
            String unite,
            BigDecimal quantite,
            BigDecimal prixUnitaireHt,
            BigDecimal montantHt,
            int ordre) {}

    record BudgetRubrique(
            String rubrique, String label, BigDecimal previsionnelHt, boolean nonFiable, String sourceOrigine) {}

    record ConversionResult(String chantierId, String marcheId) {}
}
