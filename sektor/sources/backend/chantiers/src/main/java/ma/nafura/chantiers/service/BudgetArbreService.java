package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.domain.commande.BonCommandeAchat;
import ma.nafura.achats.repository.BonCommandeAchatRepository;
import ma.nafura.chantiers.api.dto.BudgetArbreDto;
import ma.nafura.chantiers.domain.budget.CoutReelNoeud;
import ma.nafura.chantiers.domain.budget.DebourseNoeud;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.budget.RubriqueDebourse;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.CoutReelNoeudRepository;
import ma.nafura.chantiers.repository.DebourseNoeudRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Le budget lu sur l'arbre : déboursé, marge et écart au poste, au lot et au chantier (AC-9,
 * AC-12, AC-13).
 *
 * <p><b>Rien n'est stocké ici.</b> Un parent vaut la somme de ses enfants, calculée à la lecture.
 * Modifier le déboursé d'un seul poste change immédiatement son lot et le chantier, sans aucune
 * autre écriture — il n'y a plus de second endroit où un total pourrait diverger de ses
 * composantes (AC-8, AC-9).
 *
 * <p><b>Aucun planning n'est requis</b> (AC-14) : l'avancement lu est celui du nœud, en quantité,
 * et son absence vaut zéro. Aucune activité, aucune zone, aucune quotité n'entre dans un seul de
 * ces calculs.
 */
@Service
public class BudgetArbreService {

    private static final int MONEY_SCALE = 2;
    private static final int PERCENT_SCALE = 2;
    private static final BigDecimal CENT = BigDecimal.valueOf(100);

    private final ChantierService chantierService;
    private final ChantierLotRepository lotRepository;
    private final PosteBudgetaireRepository posteRepository;
    private final DebourseNoeudRepository debourseRepository;
    private final CoutReelNoeudRepository coutReelRepository;
    private final AvancementLectureService avancementLectureService;
    private final BonCommandeAchatRepository bonCommandeRepository;

    public BudgetArbreService(
            ChantierService chantierService,
            ChantierLotRepository lotRepository,
            PosteBudgetaireRepository posteRepository,
            DebourseNoeudRepository debourseRepository,
            CoutReelNoeudRepository coutReelRepository,
            AvancementLectureService avancementLectureService,
            BonCommandeAchatRepository bonCommandeRepository) {
        this.chantierService = chantierService;
        this.lotRepository = lotRepository;
        this.posteRepository = posteRepository;
        this.debourseRepository = debourseRepository;
        this.coutReelRepository = coutReelRepository;
        this.avancementLectureService = avancementLectureService;
        this.bonCommandeRepository = bonCommandeRepository;
    }

    @Transactional(readOnly = true)
    public BudgetArbreDto lireArbre(String chantierId) {
        UUID tenantId = tenantId();
        Chantier chantier = chantierService.getById(chantierId);

        List<ChantierLot> lots =
                lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId);

        Map<String, List<ChantierLot>> sousLotsParParent = new LinkedHashMap<>();
        List<ChantierLot> racines = new ArrayList<>();
        for (ChantierLot lot : lots) {
            if (StringUtils.hasText(lot.getParentLotId())) {
                sousLotsParParent.computeIfAbsent(lot.getParentLotId(), k -> new ArrayList<>()).add(lot);
            } else {
                racines.add(lot);
            }
        }

        Map<String, List<PosteBudgetaire>> postesParLot = new LinkedHashMap<>();
        List<String> tousLesPostes = new ArrayList<>();
        for (ChantierLot lot : lots) {
            List<PosteBudgetaire> postes =
                    posteRepository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(tenantId, lot.getId());
            postesParLot.put(lot.getId(), postes);
            postes.forEach(p -> tousLesPostes.add(p.getId()));
        }

        Contexte contexte = new Contexte(
            grouperDebourses(tenantId, tousLesPostes),
            grouperCoutsReels(tenantId, tousLesPostes),
            quantitesFaites(tousLesPostes),
            grouperEngages(tenantId, chantierId));

        List<BudgetArbreDto.NoeudDto> racinesDto = new ArrayList<>();
        for (ChantierLot racine : racines) {
            racinesDto.add(noeudDeLot(racine, sousLotsParParent, postesParLot, contexte));
        }

        Agregat total = new Agregat();
        racinesDto.forEach(n -> total.ajouterDto(n.getTotaux(), n.getRubriques()));

        return BudgetArbreDto.builder()
                .chantierId(chantier.getId())
                .code(chantier.getCode())
                .name(chantier.getLabel())
                .client(chantier.getClientName())
                // AC-14 — le statut réel du chantier, jamais un statut voisin ni un état de présentation.
                .status(chantier.getStatus())
                .lots(racinesDto)
                .totaux(total.totaux())
                .rubriques(total.rubriques())
                .build();
    }

    // ── Construction de l'arbre ──────────────────────────────────────────────

    private BudgetArbreDto.NoeudDto noeudDeLot(
            ChantierLot lot,
            Map<String, List<ChantierLot>> sousLotsParParent,
            Map<String, List<PosteBudgetaire>> postesParLot,
            Contexte contexte) {
        List<BudgetArbreDto.NoeudDto> enfants = new ArrayList<>();
        for (ChantierLot sousLot : sousLotsParParent.getOrDefault(lot.getId(), List.of())) {
            enfants.add(noeudDeLot(sousLot, sousLotsParParent, postesParLot, contexte));
        }
        for (PosteBudgetaire poste : postesParLot.getOrDefault(lot.getId(), List.of())) {
            enfants.add(noeudDePoste(poste, contexte));
        }

        // Un lot vaut la somme de ses enfants. Il ne porte aucun montant à lui, y compris son
        // vendu : le prendre sur le lot ET sur ses postes le compterait deux fois (AC-1, AC-9).
        Agregat agregat = new Agregat();
        enfants.forEach(e -> agregat.ajouterDto(e.getTotaux(), e.getRubriques()));

        return BudgetArbreDto.NoeudDto.builder()
                .id(lot.getId())
                .type(StringUtils.hasText(lot.getParentLotId()) ? "SOUS_LOT" : "LOT")
                .code(lot.getCode())
                .designation(lot.getDesignation())
                .nature(lot.getNature())
                .unite(lot.getUnite())
                .totaux(agregat.totaux())
                .rubriques(agregat.rubriques())
                .enfants(enfants)
                .build();
    }

    private BudgetArbreDto.NoeudDto noeudDePoste(PosteBudgetaire poste, Contexte contexte) {
        Map<RubriqueDebourse, Montants> parRubrique = new EnumMap<>(RubriqueDebourse.class);
        for (DebourseNoeud ligne : contexte.debourses().getOrDefault(poste.getId(), List.of())) {
            parRubrique
                    .computeIfAbsent(ligne.getRubrique(), k -> new Montants())
                    .ajouterPrevu(ligne.getPrevuHt(), ligne.getReviseHt());
        }
        for (CoutReelNoeud cout : contexte.coutsReels().getOrDefault(poste.getId(), List.of())) {
            parRubrique.computeIfAbsent(cout.getRubrique(), k -> new Montants()).ajouterReel(cout.getMontantHt());
        }

        BigDecimal prevu = BigDecimal.ZERO;
        BigDecimal revise = BigDecimal.ZERO;
        BigDecimal reel = BigDecimal.ZERO;
        for (Montants m : parRubrique.values()) {
            prevu = prevu.add(m.prevu);
            revise = revise.add(m.revise);
            reel = reel.add(m.reel);
        }

        BigDecimal vendu = poste.getMontantHt() != null ? poste.getMontantHt() : BigDecimal.ZERO;
        BigDecimal quantitePrevue = poste.getQuantite();
        BigDecimal quantiteFaite = contexte.quantitesFaites().get(poste.getId());
        BigDecimal avancement = avancementEnQuantite(quantitePrevue, quantiteFaite);
        // AC-13 — ce qui est fait, valorisé au prévu. Le révisé sert à piloter, pas à mesurer.
        BigDecimal debourseFait = prevu.multiply(avancement).divide(CENT, MONEY_SCALE, RoundingMode.HALF_UP);

        List<BudgetArbreDto.RubriqueTotalDto> rubriques = new ArrayList<>();
        for (RubriqueDebourse rubrique : RubriqueDebourse.AFFICHAGE) {
            Montants m = parRubrique.get(rubrique);
            if (m == null && !rubrique.estVentilee()) {
                continue;
            }
            Montants valeurs = m != null ? m : new Montants();
            rubriques.add(BudgetArbreDto.RubriqueTotalDto.builder()
                    .rubrique(rubrique.name())
                    .label(rubrique.libelle())
                    .prevuHt(argent(valeurs.prevu))
                    .reviseHt(argent(valeurs.revise))
                    .reelHt(argent(valeurs.reel))
                    .ecartHt(argent(valeurs.revise.subtract(valeurs.reel)))
                    .build());
        }

        BigDecimal engage = contexte.engageParPoste().getOrDefault(poste.getId(), BigDecimal.ZERO);
        return BudgetArbreDto.NoeudDto.builder()
                .id(poste.getId())
                .type("POSTE")
                .code(poste.getCode())
                .designation(poste.getDesignation())
                .nature(poste.getNature())
                .origine(poste.getDebourseOrigine())
                .nonFiable(Boolean.TRUE.equals(poste.getDebourseNonFiable()))
                .unite(poste.getUnite())
                .quantitePrevue(quantitePrevue)
                .quantiteFaite(quantiteFaite)
                .totaux(totaux(vendu, prevu, revise, reel, avancement, debourseFait, engage))
                .rubriques(rubriques)
                .enfants(List.of())
                .build();
    }

    // ── Calculs ──────────────────────────────────────────────────────────────

    /**
     * AC-13 — avancement du nœud, en quantité : quantité faite / quantité prévue.
     *
     * <p>Tant qu'aucun avancement n'est saisi, il vaut zéro : la valeur acquise vaut zéro, l'écart
     * reste lisible, rien n'est masqué et rien n'échoue. Plafonné à 100 % — un nœud fait à plus
     * de 100 % relève de l'avenant, pas d'un budget qui gonfle tout seul.
     */
    static BigDecimal avancementEnQuantite(BigDecimal quantitePrevue, BigDecimal quantiteFaite) {
        if (quantitePrevue == null
                || quantitePrevue.signum() <= 0
                || quantiteFaite == null
                || quantiteFaite.signum() <= 0) {
            return BigDecimal.ZERO.setScale(PERCENT_SCALE);
        }
        BigDecimal percent = quantiteFaite
                .multiply(CENT)
                .divide(quantitePrevue, PERCENT_SCALE, RoundingMode.HALF_UP);
        return percent.min(CENT.setScale(PERCENT_SCALE));
    }

    private static BudgetArbreDto.TotauxDto totaux(
            BigDecimal vendu,
            BigDecimal prevu,
            BigDecimal revise,
            BigDecimal reel,
            BigDecimal avancement,
            BigDecimal debourseFait,
            BigDecimal engage) {
        BigDecimal margePrevue = vendu.subtract(prevu);
        BigDecimal margeReelle = vendu.subtract(reel);
        return BudgetArbreDto.TotauxDto.builder()
                .venduHt(argent(vendu))
                .deboursePrevuHt(argent(prevu))
                .debourseReviseHt(argent(revise))
                .debourseReelHt(argent(reel))
                .engageHt(argent(engage))
                .margePrevueHt(argent(margePrevue))
                .margePrevuePercent(pourcentDuVendu(margePrevue, vendu))
                .margeReelleHt(argent(margeReelle))
                .margeReellePercent(pourcentDuVendu(margeReelle, vendu))
                .avancementPercent(avancement.setScale(PERCENT_SCALE, RoundingMode.HALF_UP))
                .debourseFaitHt(argent(debourseFait))
                .ecartHt(argent(debourseFait.subtract(reel)))
                .build();
    }

    /**
     * Un nœud interne a un vendu nul : sa marge vaut l'opposé de son déboursé, et un pourcentage
     * n'y veut rien dire. On rend {@code null} plutôt que zéro — un écran qui affiche « 0 % »
     * sur l'installation de chantier ment (AC-12).
     */
    private static BigDecimal pourcentDuVendu(BigDecimal marge, BigDecimal vendu) {
        if (vendu == null || vendu.signum() == 0) {
            return null;
        }
        return marge.multiply(CENT).divide(vendu, PERCENT_SCALE, RoundingMode.HALF_UP);
    }

    // ── Chargement ───────────────────────────────────────────────────────────

    private Map<String, List<DebourseNoeud>> grouperDebourses(UUID tenantId, List<String> posteIds) {
        Map<String, List<DebourseNoeud>> out = new HashMap<>();
        if (posteIds.isEmpty()) {
            return out;
        }
        for (DebourseNoeud ligne : debourseRepository.findByTenantIdAndPosteIdIn(tenantId, posteIds)) {
            out.computeIfAbsent(ligne.getPosteId(), k -> new ArrayList<>()).add(ligne);
        }
        return out;
    }

    private Map<String, List<CoutReelNoeud>> grouperCoutsReels(UUID tenantId, List<String> posteIds) {
        Map<String, List<CoutReelNoeud>> out = new HashMap<>();
        if (posteIds.isEmpty()) {
            return out;
        }
        for (CoutReelNoeud cout : coutReelRepository.findByTenantIdAndPosteIdIn(tenantId, posteIds)) {
            out.computeIfAbsent(cout.getPosteId(), k -> new ArrayList<>()).add(cout);
        }
        return out;
    }

    private Map<String, BigDecimal> grouperEngages(UUID tenantId, String chantierId) {
        Map<String, BigDecimal> out = new HashMap<>();
        for (BonCommandeAchat bc :
                bonCommandeRepository.findByTenantIdAndChantierIdOrderByCreatedAtDesc(tenantId, chantierId)) {
            if (BonCommandeAchat.STATUS_BROUILLON.equals(bc.getStatus())
                    || BonCommandeAchat.STATUS_ANNULE.equals(bc.getStatus())) {
                continue;
            }
            if (!StringUtils.hasText(bc.getNoeudId()) || bc.getTotalHt() == null) {
                continue;
            }
            out.merge(bc.getNoeudId(), bc.getTotalHt(), BigDecimal::add);
        }
        return out;
    }

    /**
     * La quantité faite de chaque poste : le cumul de ses déclarations (AC-3 du contrat
     * avancement-et-attachement — source unique, {@link AvancementLectureService}), pas la
     * dernière saisie seule.
     */
    private Map<String, BigDecimal> quantitesFaites(List<String> posteIds) {
        Map<String, BigDecimal> out = new HashMap<>();
        for (String posteId : posteIds) {
            out.put(posteId, avancementLectureService.quantiteFaiteCumuleePoste(posteId));
        }
        return out;
    }

    private static BigDecimal argent(BigDecimal value) {
        return (value != null ? value : BigDecimal.ZERO).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private record Contexte(
            Map<String, List<DebourseNoeud>> debourses,
            Map<String, List<CoutReelNoeud>> coutsReels,
            Map<String, BigDecimal> quantitesFaites,
            Map<String, BigDecimal> engageParPoste) {}

    private static final class Montants {
        BigDecimal prevu = BigDecimal.ZERO;
        BigDecimal revise = BigDecimal.ZERO;
        BigDecimal reel = BigDecimal.ZERO;

        void ajouterPrevu(BigDecimal p, BigDecimal r) {
            prevu = prevu.add(p != null ? p : BigDecimal.ZERO);
            revise = revise.add(r != null ? r : BigDecimal.ZERO);
        }

        void ajouterReel(BigDecimal montant) {
            reel = reel.add(montant != null ? montant : BigDecimal.ZERO);
        }
    }

    /**
     * L'addition d'un parent : la somme de ses enfants, et rien d'autre.
     *
     * <p>L'avancement d'un parent est pondéré par le déboursé prévu de ses enfants — un lot n'a
     * pas d'unité commune, donc pas de quantité à diviser. Sans déboursé prévu nulle part, il
     * reste à zéro plutôt que de moyenner des pourcentages sans poids, ce qui ferait dire à un
     * lot qu'il est à moitié fait parce qu'un poste à 3 DH est terminé.
     */
    private static final class Agregat {
        BigDecimal vendu = BigDecimal.ZERO;
        BigDecimal prevu = BigDecimal.ZERO;
        BigDecimal revise = BigDecimal.ZERO;
        BigDecimal reel = BigDecimal.ZERO;
        BigDecimal engage = BigDecimal.ZERO;
        BigDecimal debourseFait = BigDecimal.ZERO;
        final Map<RubriqueDebourse, Montants> parRubrique = new EnumMap<>(RubriqueDebourse.class);

        void ajouterDto(
                BudgetArbreDto.TotauxDto totaux, List<BudgetArbreDto.RubriqueTotalDto> rubriques) {
            if (totaux != null) {
                vendu = vendu.add(nz(totaux.getVenduHt()));
                prevu = prevu.add(nz(totaux.getDeboursePrevuHt()));
                revise = revise.add(nz(totaux.getDebourseReviseHt()));
                reel = reel.add(nz(totaux.getDebourseReelHt()));
                engage = engage.add(nz(totaux.getEngageHt()));
                debourseFait = debourseFait.add(nz(totaux.getDebourseFaitHt()));
            }
            for (BudgetArbreDto.RubriqueTotalDto r : rubriques != null ? rubriques : List.<BudgetArbreDto.RubriqueTotalDto>of()) {
                Montants m = parRubrique.computeIfAbsent(
                        RubriqueDebourse.valueOf(r.getRubrique()), k -> new Montants());
                m.ajouterPrevu(r.getPrevuHt(), r.getReviseHt());
                m.ajouterReel(r.getReelHt());
            }
        }

        BudgetArbreDto.TotauxDto totaux() {
            BigDecimal avancement = prevu.signum() > 0
                    ? debourseFait.multiply(CENT).divide(prevu, PERCENT_SCALE, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return BudgetArbreService.totaux(vendu, prevu, revise, reel, avancement, debourseFait, engage);
        }

        List<BudgetArbreDto.RubriqueTotalDto> rubriques() {
            List<BudgetArbreDto.RubriqueTotalDto> out = new ArrayList<>();
            for (RubriqueDebourse rubrique : RubriqueDebourse.AFFICHAGE) {
                Montants m = parRubrique.get(rubrique);
                if (m == null && !rubrique.estVentilee()) {
                    continue;
                }
                Montants valeurs = m != null ? m : new Montants();
                out.add(BudgetArbreDto.RubriqueTotalDto.builder()
                        .rubrique(rubrique.name())
                        .label(rubrique.libelle())
                        .prevuHt(argent(valeurs.prevu))
                        .reviseHt(argent(valeurs.revise))
                        .reelHt(argent(valeurs.reel))
                        .ecartHt(argent(valeurs.revise.subtract(valeurs.reel)))
                        .build());
            }
            return out;
        }

        private static BigDecimal nz(BigDecimal value) {
            return value != null ? value : BigDecimal.ZERO;
        }
    }
}
