package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.chantiers.api.request.CoutReelCreateDto;
import ma.nafura.chantiers.domain.budget.CoutReelNoeud;
import ma.nafura.chantiers.domain.budget.OrigineDebourse;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.budget.RubriqueDebourse;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.CoutReelNoeudRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Où tombe le réel (AC-10, AC-11).
 *
 * <p>Une imputation, c'est un <b>nœud</b> et une <b>rubrique</b>. Jamais une activité : aucune
 * n'est requise, aucune n'est demandée, aucune n'est proposée. Un chantier sans planning impute
 * son réel exactement comme un autre (AC-14).
 *
 * <p>Un coût qui arrive sans nœud ne se perd pas et ne tombe pas en vrac : il est imputé au nœud
 * interne <b>« Frais de chantier »</b>, créé <b>à la première imputation de ce type</b> — pas à
 * la conversion, qui reste une copie fidèle du devis. Il est visible comme n'importe quel autre
 * nœud, et l'utilisateur peut le ré-imputer après coup.
 */
@Service
public class ImputationCoutReelService {

    /** Le lot d'accueil des dépenses non rattachées. Un seul par chantier, créé à la demande. */
    public static final String CODE_FRAIS_DE_CHANTIER = "FRAIS";

    public static final String LIBELLE_FRAIS_DE_CHANTIER = "Frais de chantier";

    private final CoutReelNoeudRepository repository;
    private final PosteBudgetaireRepository posteRepository;
    private final ChantierLotRepository lotRepository;
    private final ChantierService chantierService;

    public ImputationCoutReelService(
            CoutReelNoeudRepository repository,
            PosteBudgetaireRepository posteRepository,
            ChantierLotRepository lotRepository,
            ChantierService chantierService) {
        this.repository = repository;
        this.posteRepository = posteRepository;
        this.lotRepository = lotRepository;
        this.chantierService = chantierService;
    }

    @Transactional
    public CoutReelNoeud imputer(String chantierId, CoutReelCreateDto request) {
        UUID tenantId = tenantId();
        chantierService.getById(chantierId);

        RubriqueDebourse rubrique = RubriqueDebourse.parse(request.getRubrique());
        if (rubrique == null || !rubrique.estVentilee()) {
            // Le non ventilé décrit un chiffrage prévu qu'on n'a pas su décomposer. Une dépense
            // réelle, elle, sait toujours ce qu'elle a payé.
            throw new IllegalArgumentException("chantiers.cout_reel.rubrique_invalide");
        }
        BigDecimal montant = request.getMontantHt();
        if (montant == null || montant.signum() == 0) {
            throw new IllegalArgumentException("chantiers.cout_reel.montant_requis");
        }

        boolean parDefaut = !StringUtils.hasText(request.getPosteId());
        PosteBudgetaire poste = parDefaut
                ? fraisDeChantier(tenantId, chantierId)
                : requirePosteDuChantier(tenantId, chantierId, request.getPosteId().trim());

        LocalDate date = request.getDateCout() != null ? request.getDateCout() : LocalDate.now();
        return repository.save(CoutReelNoeud.builder()
                .id(UUID.randomUUID().toString())
                .tenantId(tenantId)
                .chantierId(chantierId)
                .posteId(poste.getId())
                .rubrique(rubrique)
                .montantHt(montant)
                .dateCout(date)
                .libelle(trimOrNull(request.getLibelle()))
                .source(trimOrNull(request.getSource()))
                .imputeParDefaut(parDefaut)
                .build());
    }

    /**
     * AC-11 — ré-imputer une dépense sur le bon nœud, après coup.
     *
     * <p>C'est ce qui rend « Frais de chantier » acceptable : la dépense y est visible et
     * n'y reste pas prisonnière.
     */
    @Transactional
    public CoutReelNoeud reimputer(String coutId, String posteId) {
        UUID tenantId = tenantId();
        CoutReelNoeud cout = repository
                .findByIdAndTenantId(coutId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Cout reel not found: " + coutId));
        if (!StringUtils.hasText(posteId)) {
            throw new IllegalArgumentException("chantiers.cout_reel.noeud_requis");
        }
        PosteBudgetaire poste = requirePosteDuChantier(tenantId, cout.getChantierId(), posteId.trim());
        cout.setPosteId(poste.getId());
        cout.setImputeParDefaut(false);
        return repository.save(cout);
    }

    @Transactional(readOnly = true)
    public List<CoutReelNoeud> listByChantier(String chantierId) {
        chantierService.getById(chantierId);
        return repository.findByTenantIdAndChantierIdOrderByDateCoutDescCreatedAtDesc(
                tenantId(), chantierId);
    }

    // ── Frais de chantier ────────────────────────────────────────────────────

    /**
     * Le nœud « Frais de chantier » du chantier, créé s'il n'existe pas encore.
     *
     * <p>C'est un lot interne portant un poste interne : le déboursé vit sur le poste, un lot
     * valant la somme de ses enfants (AC-1). Interne, donc sans vendu et sans lien vers le devis
     * — le contrat voisin exige qu'après la conversion l'arbre contienne exactement une ligne par
     * nœud du devis, et celui-ci n'y naît pas.
     */
    private PosteBudgetaire fraisDeChantier(UUID tenantId, String chantierId) {
        ChantierLot lot = lotRepository
                .findByTenantIdAndChantierIdAndCode(tenantId, chantierId, CODE_FRAIS_DE_CHANTIER)
                .orElseGet(() -> lotRepository.save(ChantierLot.builder()
                        .id(idDeLot(chantierId))
                        .tenantId(tenantId)
                        .chantierId(chantierId)
                        .code(CODE_FRAIS_DE_CHANTIER)
                        .designation(LIBELLE_FRAIS_DE_CHANTIER)
                        .nature(NatureLigne.INTERNE)
                        .avancementPercent(BigDecimal.ZERO)
                        .ordre(ordreEnFin(tenantId, chantierId))
                        .build()));

        return posteRepository
                .findByTenantIdAndLotIdAndCode(tenantId, lot.getId(), CODE_FRAIS_DE_CHANTIER)
                .orElseGet(() -> posteRepository.save(PosteBudgetaire.builder()
                        .id(idDePoste(lot.getId()))
                        .tenantId(tenantId)
                        .lotId(lot.getId())
                        .code(CODE_FRAIS_DE_CHANTIER)
                        .designation(LIBELLE_FRAIS_DE_CHANTIER)
                        .nature(NatureLigne.INTERNE)
                        // Aucun déboursé prévu : ce nœud n'a jamais été chiffré, il encaisse.
                        // Son écart sera donc entièrement négatif, et c'est exactement ce qu'on
                        // veut voir.
                        .debourseOrigine(OrigineDebourse.SAISI)
                        .debourseNonFiable(false)
                        .ordre(0)
                        .build()));
    }

    private PosteBudgetaire requirePosteDuChantier(UUID tenantId, String chantierId, String posteId) {
        PosteBudgetaire poste = posteRepository
                .findByIdAndTenantId(posteId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Poste budgetaire not found: " + posteId));
        ChantierLot lot = lotRepository
                .findByIdAndTenantId(poste.getLotId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found: " + poste.getLotId()));
        if (!lot.getChantierId().equals(chantierId)) {
            throw new IllegalArgumentException("chantiers.cout_reel.noeud_hors_chantier: " + posteId);
        }
        return poste;
    }

    private int ordreEnFin(UUID tenantId, String chantierId) {
        return lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId).stream()
                        .mapToInt(ChantierLot::getOrdre)
                        .max()
                        .orElse(0)
                + 1;
    }

    private static String idDeLot(String chantierId) {
        return chantierId + "-lot-" + CODE_FRAIS_DE_CHANTIER.toLowerCase(Locale.ROOT);
    }

    private static String idDePoste(String lotId) {
        return lotId + "-poste-" + CODE_FRAIS_DE_CHANTIER.toLowerCase(Locale.ROOT);
    }

    private static String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
