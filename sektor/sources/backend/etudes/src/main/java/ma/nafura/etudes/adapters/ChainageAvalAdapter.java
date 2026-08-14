package ma.nafura.etudes.adapters;

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
import ma.nafura.etudes.service.port.ChainageAvalPort;
import ma.nafura.marches.api.request.ContratMarcheCreateDto;
import ma.nafura.marches.domain.contrat.ContratMarche;
import ma.nafura.marches.service.ContratMarcheService;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * L13 — adapter app : création atomique chantier → marché → lots/postes → budget.
 */
@Component
@Primary
public class ChainageAvalAdapter implements ChainageAvalPort {

    private final ChantierService chantierService;
    private final ChantierLotService lotService;
    private final PosteBudgetaireService posteService;
    private final ContratMarcheService marcheService;
    private final BudgetChantierService budgetService;

    public ChainageAvalAdapter(
            ChantierService chantierService,
            ChantierLotService lotService,
            PosteBudgetaireService posteService,
            ContratMarcheService marcheService,
            BudgetChantierService budgetService) {
        this.chantierService = chantierService;
        this.lotService = lotService;
        this.posteService = posteService;
        this.marcheService = marcheService;
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
        chantierDto.setStatus("EN_COURS");
        Chantier chantier = chantierService.create(chantierDto);

        Map<String, String> lotIdByCode = new HashMap<>();
        for (LotProjection lot : command.lots()) {
            if (DpgfNoeud.TYPE_LOT.equals(lot.type()) || DpgfNoeud.TYPE_SOUS_LOT.equals(lot.type())) {
                ChantierLotCreateDto lotDto = new ChantierLotCreateDto();
                lotDto.setCode(lot.code());
                lotDto.setDesignation(lot.designation());
                lotDto.setUnite(lot.unite());
                lotDto.setQuantite(lot.quantite());
                lotDto.setPrixUnitaireHt(lot.prixUnitaireHt());
                lotDto.setMontantHt(lot.montantHt());
                lotDto.setOrdre(lot.ordre());
                if (StringUtils.hasText(lot.parentCode()) && lotIdByCode.containsKey(lot.parentCode())) {
                    lotDto.setParentLotId(lotIdByCode.get(lot.parentCode()));
                }
                ChantierLot created = lotService.create(chantier.getId(), lotDto);
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
            if (parentLotId == null && !lotIdByCode.isEmpty()) {
                parentLotId = lotIdByCode.values().iterator().next();
            }
            if (parentLotId == null) {
                ChantierLotCreateDto root = new ChantierLotCreateDto();
                root.setCode("LOT-1");
                root.setDesignation("Lot principal");
                root.setOrdre(0);
                ChantierLot created = lotService.create(chantier.getId(), root);
                parentLotId = created.getId();
                lotIdByCode.put("LOT-1", parentLotId);
            }
            PosteBudgetaireCreateDto posteDto = new PosteBudgetaireCreateDto();
            posteDto.setCode(article.code());
            posteDto.setDesignation(article.designation());
            posteDto.setUnite(article.unite());
            posteDto.setQuantite(article.quantite());
            posteDto.setPrixUnitaireHt(article.prixUnitaireHt());
            posteDto.setMontantHt(article.montantHt());
            posteDto.setOrdre(article.ordre());
            posteService.create(parentLotId, posteDto);
        }

        ContratMarcheCreateDto marcheDto = new ContratMarcheCreateDto();
        marcheDto.setIntitule(command.marcheIntitule());
        marcheDto.setReference(command.marcheReference());
        marcheDto.setChantierId(chantier.getId());
        marcheDto.setChantierCode(chantier.getCode());
        marcheDto.setChantierNom(chantier.getLabel());
        marcheDto.setClientId(command.clientId());
        marcheDto.setClientNom(command.clientName());
        marcheDto.setMontantHt(command.montantHt());
        marcheDto.setTauxTva(command.tauxTva());
        marcheDto.setDateNotification(command.dateDemarrage());
        marcheDto.setDateDemarrage(command.dateDemarrage());
        marcheDto.setDureeMois(command.dureeMois());
        ContratMarche marche = marcheService.create(marcheDto);

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

        return new ConversionResult(chantier.getId(), marche.getId());
    }
}
