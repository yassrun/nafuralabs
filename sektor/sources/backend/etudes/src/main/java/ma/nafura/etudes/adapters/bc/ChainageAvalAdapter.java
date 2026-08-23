package ma.nafura.etudes.adapters.bc;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import ma.nafura.chantiers.api.request.BudgetChantierUpsertDto;
import ma.nafura.chantiers.api.request.ChantierCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotCreateDto;
import ma.nafura.chantiers.api.request.PosteBudgetaireCreateDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.service.BudgetChantierService;
import ma.nafura.chantiers.service.ChantierLotService;
import ma.nafura.chantiers.service.ChantierService;
import ma.nafura.chantiers.service.PosteBudgetaireService;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * L13 — adapter app : création atomique chantier → arbre (lots / postes) → budget.
 *
 * <p>Trois choses que cet adapter ne fait <b>pas</b>, et qui sont des critères, pas des détails :
 *
 * <ul>
 *   <li><b>AC-8</b> — il ne démarre pas le chantier. Celui-ci naît {@code EN_PREPARATION} ; c'est
 *       l'ordre de service qui le passe {@code EN_COURS}, ailleurs.
 *   <li><b>AC-10</b> — il ne crée aucun {@code ContratMarche}. Le marché naît à la notification.
 *       La référence de vente, jusque-là, est le devis validé.
 *   <li><b>AC-12</b> — il ne rattrape aucun poste orphelin. Le placement a été tranché par
 *       l'humain avant l'appel ; s'il reste un article sans lot d'accueil ici, c'est un bug
 *       amont et la transaction échoue plutôt que de forger un « Lot principal ».
 * </ul>
 */
@Component
@Primary
public class ChainageAvalAdapter implements ChainageAvalPort {

    private final ChantierService chantierService;
    private final ChantierLotService lotService;
    private final PosteBudgetaireService posteService;
    private final BudgetChantierService budgetService;

    public ChainageAvalAdapter(
            ChantierService chantierService,
            ChantierLotService lotService,
            PosteBudgetaireService posteService,
            BudgetChantierService budgetService) {
        this.chantierService = chantierService;
        this.lotService = lotService;
        this.posteService = posteService;
        this.budgetService = budgetService;
    }

    @Override
    @Transactional
    public ConversionResult convert(ConversionCommand command) {
        ChantierCreateDto chantierDto = new ChantierCreateDto();
        chantierDto.setLabel(command.chantierLabel());
        chantierDto.setCode(command.chantierCode());
        chantierDto.setClientId(command.clientId());
        chantierDto.setClientName(command.clientName());
        chantierDto.setMarcheNumero(command.marcheReference());
        chantierDto.setVille(command.chantierVille());
        chantierDto.setDateDemarrage(command.dateDemarrage());
        chantierDto.setDureeMois(command.dureeMois());
        chantierDto.setMontantHt(command.montantHt());
        chantierDto.setTauxTva(command.tauxTva());
        chantierDto.setDescription(command.objet());
        // AC-8 — un chantier gagné n'est pas un chantier démarré.
        chantierDto.setStatus(Chantier.STATUS_EN_PREPARATION);
        Chantier chantier = chantierService.create(chantierDto);

        Map<String, String> lotIdByCode = new HashMap<>();
        for (LotProjection lot : command.lots()) {
            if (DpgfNoeud.TYPE_LOT.equals(lot.type()) || DpgfNoeud.TYPE_SOUS_LOT.equals(lot.type())) {
                ChantierLotCreateDto lotDto = new ChantierLotCreateDto();
                lotDto.setCode(lot.code());
                lotDto.setDesignation(lot.designation());
                lotDto.setUnite(lot.unite());
                lotDto.setOrdre(lot.ordre());
                if (StringUtils.hasText(lot.parentCode()) && lotIdByCode.containsKey(lot.parentCode())) {
                    lotDto.setParentLotId(lotIdByCode.get(lot.parentCode()));
                }
                ChantierLot created;
                if (lot.dpgfNoeudId() != null) {
                    // Copie depuis le devis validé : seul producteur de lignes vendues (AC-3),
                    // et le lien retour vers le nœud DPGF est posé ici, une fois (AC-2).
                    lotDto.setQuantite(lot.quantite());
                    lotDto.setPrixUnitaireHt(lot.prixUnitaireHt());
                    lotDto.setMontantHt(lot.montantHt());
                    created = lotService.copierLotVendu(chantier.getId(), lotDto, lot.dpgfNoeudId());
                } else {
                    // Lot d'accueil décidé par l'humain (AC-12) : il ne vient pas du devis, donc
                    // il est interne (AC-3) et ne porte pas de prix de vente (AC-4).
                    created = lotService.create(chantier.getId(), lotDto);
                }
                lotIdByCode.put(lot.code(), created.getId());
            }
        }
        for (LotProjection article : command.lots()) {
            if (!DpgfNoeud.TYPE_ARTICLE.equals(article.type())) {
                continue;
            }
            String parentLotId = StringUtils.hasText(article.parentCode())
                    ? lotIdByCode.get(article.parentCode())
                    : null;
            if (parentLotId == null) {
                // AC-12 — aucun rattrapage en silence. Le placement se décide devant l'humain,
                // avant que quoi que ce soit ne soit créé ; arrivé ici, il est trop tard.
                throw new IllegalStateException(
                        "chantiers.conversion.poste_sans_lot_daccueil: " + article.code());
            }
            PosteBudgetaireCreateDto posteDto = new PosteBudgetaireCreateDto();
            posteDto.setCode(article.code());
            posteDto.setDesignation(article.designation());
            posteDto.setUnite(article.unite());
            posteDto.setQuantite(article.quantite());
            posteDto.setPrixUnitaireHt(article.prixUnitaireHt());
            posteDto.setMontantHt(article.montantHt());
            posteDto.setOrdre(article.ordre());
            posteService.copierPosteVendu(parentLotId, posteDto, article.dpgfNoeudId());
        }

        BudgetChantierUpsertDto budgetDto = new BudgetChantierUpsertDto();
        BigDecimal totalPrev = BigDecimal.ZERO;
        List<BudgetChantierUpsertDto.BudgetLigneInputDto> lignes = new ArrayList<>();
        int ordre = 0;
        for (BudgetRubrique rub : command.budget()) {
            BudgetChantierUpsertDto.BudgetLigneInputDto ligne =
                    new BudgetChantierUpsertDto.BudgetLigneInputDto();
            ligne.setRubrique(rub.rubrique());
            ligne.setLabel(rub.label());
            ligne.setPrevisionnelHt(rub.previsionnelHt());
            ligne.setReviseHt(rub.previsionnelHt());
            ligne.setEngageHt(BigDecimal.ZERO);
            ligne.setRealiseHt(BigDecimal.ZERO);
            ligne.setOrdre(ordre++);
            ligne.setNonFiable(rub.nonFiable());
            ligne.setSourceOrigine(rub.sourceOrigine());
            lignes.add(ligne);
            totalPrev = totalPrev.add(rub.previsionnelHt() != null ? rub.previsionnelHt() : BigDecimal.ZERO);
        }
        budgetDto.setLignes(lignes);
        budgetDto.setPrevisionnelHt(totalPrev);
        budgetDto.setReviseHt(totalPrev);
        budgetService.upsert(chantier.getId(), budgetDto);

        return new ConversionResult(chantier.getId());
    }
}
