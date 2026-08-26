package ma.nafura.etudes.adapters.bc;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import ma.nafura.chantiers.api.request.ChantierCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotCreateDto;
import ma.nafura.chantiers.api.request.PosteBudgetaireCreateDto;
import ma.nafura.chantiers.domain.budget.OrigineDebourse;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.budget.RubriqueDebourse;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.service.ChantierLotService;
import ma.nafura.chantiers.service.ChantierService;
import ma.nafura.chantiers.service.DebourseNoeudService;
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
 * <p>Quatre choses que cet adapter ne fait <b>pas</b>, et qui sont des critères, pas des détails :
 *
 * <ul>
 *   <li><b>AC-8</b> — il ne démarre pas le chantier. Celui-ci naît {@code EN_PREPARATION} ; c'est
 *       l'ordre de service qui le passe {@code EN_COURS}, ailleurs.
 *   <li><b>AC-10</b> — il ne crée aucun {@code ContratMarche}. Le marché naît à la notification.
 *       La référence de vente, jusque-là, est le devis validé.
 *   <li><b>AC-12</b> — il ne rattrape aucun poste orphelin. Le placement a été tranché par
 *       l'humain avant l'appel ; s'il reste un article sans lot d'accueil ici, c'est un bug
 *       amont et la transaction échoue plutôt que de forger un « Lot principal ».
 *   <li><b>budget-et-marge AC-8, AC-11</b> — il n'écrit plus aucun budget par rubrique au niveau
 *       chantier, et il ne crée aucun nœud que le devis n'a pas produit : pas de « Frais de
 *       chantier » d'office, celui-là naît à la première imputation non rattachée. La conversion
 *       reste une copie fidèle du devis.
 * </ul>
 *
 * <p><b>Ce qu'il fait en plus</b> : il pose sur chaque poste le déboursé décomposé venu du DPU,
 * daté (AC-2, AC-5). C'est un instantané — après cet appel, l'étude et le chantier ne se parlent
 * plus.
 */
@Component
@Primary
public class ChainageAvalAdapter implements ChainageAvalPort {

    private final ChantierService chantierService;
    private final ChantierLotService lotService;
    private final PosteBudgetaireService posteService;
    private final DebourseNoeudService debourseService;

    public ChainageAvalAdapter(
            ChantierService chantierService,
            ChantierLotService lotService,
            PosteBudgetaireService posteService,
            DebourseNoeudService debourseService) {
        this.chantierService = chantierService;
        this.lotService = lotService;
        this.posteService = posteService;
        this.debourseService = debourseService;
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
        // AC-9 — le snapshot commercial voyage avec la commande ; l'adapter ne le recalcule pas.
        chantierDto.setDossierEtudeId(command.dossierId());
        chantierDto.setDevisId(command.devisId());
        chantierDto.setDevisNumero(command.devisNumero());
        chantierDto.setDevisVersion(command.devisVersion());
        chantierDto.setDateAcceptation(command.dateAcceptation());
        chantierDto.setSourceVente(command.sourceVente());
        chantierDto.setMontantVenteInitialHt(command.montantVenteInitialHt());
        chantierDto.setDebourseInitialHt(command.debourseInitialHt());
        Chantier chantier = chantierService.create(chantierDto);

        Map<String, String> lotIdByCode = new HashMap<>();
        for (LotProjection lot : ordonnerParentsAvantEnfants(command.lots())) {
            if (DpgfNoeud.TYPE_LOT.equals(lot.type()) || DpgfNoeud.TYPE_SOUS_LOT.equals(lot.type())) {
                ChantierLotCreateDto lotDto = new ChantierLotCreateDto();
                lotDto.setCode(lot.code());
                lotDto.setDesignation(lot.designation());
                lotDto.setUnite(lot.unite());
                lotDto.setOrdre(lot.ordre());
                if (StringUtils.hasText(lot.parentCode())) {
                    String parentLotId = lotIdByCode.get(lot.parentCode());
                    if (parentLotId == null) {
                        // AC-12 — même règle que pour les postes : un nœud dont le parent n'existe
                        // nulle part dans le devis ne se rattache pas en silence à la racine.
                        // Le placement se décide devant l'humain, avant toute création.
                        throw new IllegalStateException(
                                "chantiers.conversion.lot_sans_parent_daccueil: " + lot.code());
                    }
                    lotDto.setParentLotId(parentLotId);
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
            PosteBudgetaire poste =
                    posteService.copierPosteVendu(parentLotId, posteDto, article.dpgfNoeudId());
            copierLeDebourse(poste, article.debourse());
        }

        return new ConversionResult(chantier.getId());
    }

    /**
     * Pose le déboursé décomposé du DPU sur le nœud fraîchement copié (AC-1 à AC-5).
     *
     * <p>Un poste sans projection de déboursé n'est pas une erreur — c'est un bordereau dont
     * l'article n'a ni coût ni DPU. Il reste à zéro, visible, plutôt que de faire échouer une
     * conversion par ailleurs correcte : l'absence de décomposition ne bloque jamais la copie
     * (AC-3).
     */
    private void copierLeDebourse(PosteBudgetaire poste, DebourseProjection debourse) {
        if (poste == null || debourse == null) {
            return;
        }
        List<DebourseNoeudService.PartCopiee> parts = new ArrayList<>();
        for (PartRubrique part : debourse.parts()) {
            parts.add(new DebourseNoeudService.PartCopiee(
                    RubriqueDebourse.parse(part.rubrique()), part.montantHt()));
        }
        debourseService.copierDepuisLEtude(
                poste.getId(),
                OrigineDebourse.parse(debourse.origine()),
                debourse.nonFiable(),
                debourse.prixDpuId(),
                debourse.prixDpuVersion(),
                parts);
    }

    /**
     * Réordonne les nœuds pour qu'un parent soit toujours traité avant ses enfants.
     *
     * <p><b>Pourquoi ça existe.</b> L'arbre se construisait en un seul passage, dans l'ordre
     * d'affichage du devis ({@code ORDER BY ordre ASC}). Un sous-lot rencontré <i>avant</i> le lot
     * qui le contient ne trouvait pas son parent dans {@code lotIdByCode} — pas encore créé — et
     * naissait à la racine, <b>en silence</b>. Sa donnée était pourtant parfaitement valide : côté
     * étude, {@code validateTypeParent} exige un parent pour tout {@code SOUS_LOT}.
     *
     * <p>Ce n'était donc pas un devis mal formé mais une hypothèse fragile du code — « les parents
     * arrivent toujours en premier » — que rien ne garantissait : une renumérotation manuelle du
     * bordereau ou une extraction IA suivant la mise en page du PDF suffisait à l'invalider.
     *
     * <p>Trier ici fait disparaître le cas entièrement, plutôt que de le rattraper. Ne reste que le
     * vrai orphelin — un {@code parentCode} qui ne désigne aucun nœud du devis — traité comme les
     * postes : nommé, placé par l'humain, jamais deviné (AC-12).
     */
    private List<LotProjection> ordonnerParentsAvantEnfants(List<LotProjection> lots) {
        Map<String, List<LotProjection>> enfantsParParent = new HashMap<>();
        List<LotProjection> racines = new ArrayList<>();
        Map<String, LotProjection> parCode = new HashMap<>();

        for (LotProjection n : lots) {
            if (DpgfNoeud.TYPE_LOT.equals(n.type()) || DpgfNoeud.TYPE_SOUS_LOT.equals(n.type())) {
                parCode.put(n.code(), n);
            }
        }
        for (LotProjection n : lots) {
            if (!DpgfNoeud.TYPE_LOT.equals(n.type()) && !DpgfNoeud.TYPE_SOUS_LOT.equals(n.type())) {
                continue;
            }
            // Un parent qui n'existe pas dans le devis reste une racine ici : l'échec explicite
            // appartient à la boucle de création, pas au tri.
            if (StringUtils.hasText(n.parentCode()) && parCode.containsKey(n.parentCode())) {
                enfantsParParent.computeIfAbsent(n.parentCode(), c -> new ArrayList<>()).add(n);
            } else {
                racines.add(n);
            }
        }

        List<LotProjection> ordonnes = new ArrayList<>();
        for (LotProjection racine : racines) {
            empilerAvecSesEnfants(racine, enfantsParParent, ordonnes, new HashSet<>());
        }
        // Les articles gardent leur ordre d'origine, après tous les lots : leur rattachement ne
        // dépend pas de l'ordre, il est résolu par code une fois l'arbre des lots complet.
        for (LotProjection n : lots) {
            if (DpgfNoeud.TYPE_ARTICLE.equals(n.type())) {
                ordonnes.add(n);
            }
        }
        return ordonnes;
    }

    private void empilerAvecSesEnfants(
            LotProjection noeud,
            Map<String, List<LotProjection>> enfantsParParent,
            List<LotProjection> sortie,
            Set<String> dejaVus) {
        if (!dejaVus.add(noeud.code())) {
            // Cycle de codes dans le devis — on ne boucle pas indéfiniment ; le nœud est déjà placé.
            return;
        }
        sortie.add(noeud);
        for (LotProjection enfant : enfantsParParent.getOrDefault(noeud.code(), List.of())) {
            empilerAvecSesEnfants(enfant, enfantsParParent, sortie, dejaVus);
        }
    }
}
