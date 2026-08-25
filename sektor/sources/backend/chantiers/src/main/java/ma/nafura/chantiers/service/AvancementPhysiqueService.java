package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.AvancementPhysiqueDto;
import ma.nafura.chantiers.api.request.AvancementPhysiqueCreateDto;
import ma.nafura.chantiers.api.request.AvancementPhysiqueEntryDto;
import ma.nafura.chantiers.api.request.AvancementPhysiqueUpdateDto;
import ma.nafura.chantiers.domain.attachement.AttachementChantier;
import ma.nafura.chantiers.domain.avancement.AvancementPhysique;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.AttachementChantierRepository;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * La quantité fait foi, le pourcentage se calcule — contrat {@code avancement-et-attachement},
 * AC-1 à AC-9.
 *
 * <p>Une déclaration porte un **nœud feuille** (poste, ou lot sans enfant), une quantité et une
 * date (AC-1). Le pourcentage n'est jamais écrit : {@link AvancementLectureService} le dérive à
 * la lecture (AC-2, AC-3). Un dépassement de la quantité prévue est refusé (AC-5), un nœud sans
 * quantité prévue n'accepte aucune déclaration (AC-6), et un nœud déjà repris par un attachement
 * signé est figé (AC-7). Palier 1 : aucune activité n'existe, donc {@link
 * ActiviteCouvertureService} ne couvre jamais rien — la porte d'AC-9 est posée, sans effet.
 */
@Service
public class AvancementPhysiqueService {

    static final String ERR_NOEUD_REQUIS = "chantiers.avancement.noeud_requis";
    static final String ERR_LOT_A_DES_ENFANTS = "chantiers.avancement.lot_a_des_enfants";
    static final String ERR_QUANTITE_PREVUE_MANQUANTE = "chantiers.avancement.quantite_prevue_manquante";
    static final String ERR_DEPASSEMENT = "chantiers.avancement.depassement_quantite_prevue";
    static final String ERR_NOEUD_COUVERT_PAR_ACTIVITE = "chantiers.avancement.noeud_couvert_par_activite";
    static final String ERR_DECLARATION_FIGEE = "chantiers.avancement.declaration_figee_par_attachement";

    private final AvancementPhysiqueRepository repository;
    private final ChantierService chantierService;
    private final ChantierLotRepository lotRepository;
    private final PosteBudgetaireRepository posteRepository;
    private final AttachementChantierRepository attachementRepository;
    private final AvancementLectureService avancementLectureService;
    private final ActiviteCouvertureService activiteCouvertureService;

    public AvancementPhysiqueService(
            AvancementPhysiqueRepository repository,
            ChantierService chantierService,
            ChantierLotRepository lotRepository,
            PosteBudgetaireRepository posteRepository,
            AttachementChantierRepository attachementRepository,
            AvancementLectureService avancementLectureService,
            ActiviteCouvertureService activiteCouvertureService) {
        this.repository = repository;
        this.chantierService = chantierService;
        this.lotRepository = lotRepository;
        this.posteRepository = posteRepository;
        this.attachementRepository = attachementRepository;
        this.avancementLectureService = avancementLectureService;
        this.activiteCouvertureService = activiteCouvertureService;
    }

    @Transactional(readOnly = true)
    public List<AvancementPhysiqueDto> listByChantier(String chantierId) {
        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        List<AvancementPhysique> rows =
                repository.findByTenantIdAndChantierIdOrderByDateSaisieDescCreatedAtDesc(tenantId, chantierId);
        return rows.stream().map(row -> toDto(row, chantier)).toList();
    }

    @Transactional
    public List<AvancementPhysiqueDto> create(String chantierId, AvancementPhysiqueCreateDto request) {
        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        List<AvancementPhysique> created = new ArrayList<>();

        for (AvancementPhysiqueEntryDto entry : request.getEntries()) {
            if (entry.getQuantiteRealisee() == null || entry.getQuantiteRealisee().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("chantiers.avancement.quantite_positive_requise");
            }

            Noeud noeud = resolveNoeud(tenantId, chantierId, entry.getLotId(), entry.getPosteId());
            garderContreDoubleImputation(noeud);
            created.add(persistDeclaration(
                    chantierId,
                    tenantId,
                    noeud,
                    request.getDate(),
                    entry.getQuantiteRealisee(),
                    trimOrNull(entry.getNotes()),
                    request.getStatus().trim(),
                    request.getSaisieParId().trim(),
                    trimOrNull(request.getSaisieParName()),
                    null));
        }

        return created.stream().map(row -> toDto(row, chantier)).toList();
    }

    /**
     * Remontée activité → nœud (AC-10). Passe la garde couverture (AC-8) : la déclaration vient
     * de l'activité qui couvre le nœud, pas d'une saisie parallèle.
     */
    @Transactional
    public AvancementPhysiqueDto enregistrerDepuisActivite(
            String chantierId,
            String lotId,
            String posteId,
            String activiteId,
            java.time.LocalDate date,
            BigDecimal quantiteRealisee,
            String notes,
            String status,
            String saisieParId,
            String saisieParName) {
        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        if (quantiteRealisee == null || quantiteRealisee.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("chantiers.avancement.quantite_positive_requise");
        }
        Noeud noeud = resolveNoeud(tenantId, chantierId, lotId, posteId);
        AvancementPhysique saved = persistDeclaration(
                chantierId,
                tenantId,
                noeud,
                date,
                quantiteRealisee,
                trimOrNull(notes),
                StringUtils.hasText(status) ? status.trim() : AvancementPhysique.STATUS_BROUILLON,
                saisieParId.trim(),
                trimOrNull(saisieParName),
                activiteId);
        return toDto(saved, chantier);
    }

    private AvancementPhysique persistDeclaration(
            String chantierId,
            UUID tenantId,
            Noeud noeud,
            java.time.LocalDate date,
            BigDecimal quantiteRealisee,
            String notes,
            String status,
            String saisieParId,
            String saisieParName,
            String activiteId) {
        garderQuantitePrevue(noeud);
        BigDecimal dejaFait = quantiteFaiteCumulee(noeud);
        garderContreDepassement(noeud, dejaFait, quantiteRealisee);
        AvancementPhysique entity = AvancementPhysique.builder()
                .id(buildId(chantierId))
                .tenantId(tenantId)
                .chantierId(chantierId)
                .lotId(noeud.lotId())
                .posteId(noeud.posteId())
                .activiteId(activiteId)
                .dateSaisie(date)
                .quantiteRealisee(quantiteRealisee)
                .notes(notes)
                .status(status)
                .saisieParId(saisieParId)
                .saisieParName(saisieParName)
                .build();
        return repository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<AvancementPhysiqueDto> findDernierByChantier(String chantierId) {
        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        List<AvancementPhysique> rows =
                repository.findByTenantIdAndChantierIdOrderByDateSaisieDescCreatedAtDesc(tenantId, chantierId);
        java.util.Map<String, AvancementPhysique> dernierByKey = new java.util.LinkedHashMap<>();
        for (AvancementPhysique row : rows) {
            dernierByKey.putIfAbsent(progressKey(row.getLotId(), row.getPosteId()), row);
        }
        return dernierByKey.values().stream().map(row -> toDto(row, chantier)).toList();
    }

    @Transactional
    public AvancementPhysiqueDto update(String id, AvancementPhysiqueUpdateDto request) {
        AvancementPhysique entity = getById(id);
        UUID tenantId = tenantId();
        Chantier chantier = chantierService.getById(entity.getChantierId());
        Noeud noeud = resolveNoeud(tenantId, entity.getChantierId(), entity.getLotId(), entity.getPosteId());
        garderContreModificationFigee(noeud, entity);

        if (request.getDate() != null) {
            entity.setDateSaisie(request.getDate());
        }
        if (request.getQuantiteRealisee() != null) {
            if (request.getQuantiteRealisee().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("chantiers.avancement.quantite_positive_requise");
            }
            BigDecimal dejaFaitHorsCetteLigne = quantiteFaiteCumulee(noeud)
                    .subtract(entity.getQuantiteRealisee());
            garderContreDepassement(noeud, dejaFaitHorsCetteLigne, request.getQuantiteRealisee());
            entity.setQuantiteRealisee(request.getQuantiteRealisee());
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (StringUtils.hasText(request.getStatus())) {
            entity.setStatus(request.getStatus().trim());
        }

        AvancementPhysique saved = repository.save(entity);
        return toDto(saved, chantier);
    }

    @Transactional
    public AvancementPhysiqueDto valider(String id) {
        AvancementPhysique entity = getById(id);
        entity.setStatus(AvancementPhysique.STATUS_VALIDE);
        AvancementPhysique saved = repository.save(entity);
        Chantier chantier = chantierService.getById(saved.getChantierId());
        return toDto(saved, chantier);
    }

    /** AC-7 — une déclaration s'annule tant qu'aucun attachement signé ne l'a reprise. */
    @Transactional
    public void annuler(String id) {
        AvancementPhysique entity = getById(id);
        UUID tenantId = tenantId();
        Noeud noeud = resolveNoeud(tenantId, entity.getChantierId(), entity.getLotId(), entity.getPosteId());
        garderContreModificationFigee(noeud, entity);
        repository.delete(entity);
    }

    private AvancementPhysique getById(String id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Avancement not found: " + id));
    }

    // ── AC-1 : résolution du nœud feuille ───────────────────────────────────

    private Noeud resolveNoeud(UUID tenantId, String chantierId, String lotIdRaw, String posteIdRaw) {
        String posteId = trimOrNull(posteIdRaw);
        String lotId = trimOrNull(lotIdRaw);

        if (StringUtils.hasText(posteId)) {
            PosteBudgetaire poste = posteRepository
                    .findByIdAndTenantId(posteId, tenantId)
                    .orElseThrow(() -> new IllegalArgumentException("Poste not found: " + posteId));
            return new Noeud(poste.getLotId(), poste.getId(), poste.getQuantite(), poste.getNature());
        }

        if (StringUtils.hasText(lotId)) {
            ChantierLot lot = lotRepository
                    .findByIdAndTenantId(lotId, tenantId)
                    .filter(item -> chantierId.equals(item.getChantierId()))
                    .orElseThrow(() -> new IllegalArgumentException("Lot not found for chantier: " + lotId));
            boolean aDesSousLots = !lotRepository.findByTenantIdAndParentLotId(tenantId, lotId).isEmpty();
            boolean aDesPostes =
                    !posteRepository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(tenantId, lotId).isEmpty();
            if (aDesSousLots || aDesPostes) {
                throw new IllegalArgumentException(ERR_LOT_A_DES_ENFANTS + ": " + lotId);
            }
            return new Noeud(lot.getId(), null, lot.getQuantite(), lot.getNature());
        }

        throw new IllegalArgumentException(ERR_NOEUD_REQUIS);
    }

    // ── AC-9 : jamais deux portes sur le même nœud ──────────────────────────

    private void garderContreDoubleImputation(Noeud noeud) {
        List<String> activites = activiteCouvertureService.activitesCouvrant(noeud.id());
        if (!activites.isEmpty()) {
            throw new IllegalArgumentException(
                    ERR_NOEUD_COUVERT_PAR_ACTIVITE + ": " + String.join(", ", activites));
        }
    }

    // ── AC-6 : pas de quantité prévue, pas de déclaration ───────────────────

    private void garderQuantitePrevue(Noeud noeud) {
        if (noeud.quantitePrevue() == null || noeud.quantitePrevue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(ERR_QUANTITE_PREVUE_MANQUANTE + ": " + noeud.id());
        }
    }

    // ── AC-5 : dépassement refusé, la sortie est l'avenant ──────────────────

    private void garderContreDepassement(Noeud noeud, BigDecimal dejaFait, BigDecimal quantiteAjoutee) {
        BigDecimal base = dejaFait != null ? dejaFait : BigDecimal.ZERO;
        BigDecimal nouveauCumul = base.add(quantiteAjoutee);
        if (nouveauCumul.compareTo(noeud.quantitePrevue()) > 0) {
            BigDecimal resteAFaire = noeud.quantitePrevue().subtract(base).max(BigDecimal.ZERO);
            throw new IllegalArgumentException(
                    ERR_DEPASSEMENT
                            + ": reste_a_faire=" + resteAFaire
                            + " noeud=" + noeud.id()
                            + " — la quantité au-delà du prévu relève de l'avenant ou des travaux supplémentaires");
        }
    }

    // ── AC-7 : figé dès qu'un attachement signé l'a repris ──────────────────

    private void garderContreModificationFigee(Noeud noeud, AvancementPhysique row) {
        // Seuls les nœuds vendus entrent dans un attachement (AC-13) : un interne n'est jamais figé.
        if (noeud.nature() != NatureLigne.VENDU) {
            return;
        }
        boolean figee = attachementRepository
                .existsByTenantIdAndChantierIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqualAndStatusIn(
                        tenantId(),
                        row.getChantierId(),
                        row.getDateSaisie(),
                        row.getDateSaisie(),
                        AttachementChantier.STATUTS_FIGES);
        if (figee) {
            throw new IllegalStateException(ERR_DECLARATION_FIGEE + ": " + row.getId());
        }
    }

    private BigDecimal quantiteFaiteCumulee(Noeud noeud) {
        return noeud.posteId() != null
                ? avancementLectureService.quantiteFaiteCumuleePoste(noeud.posteId())
                : avancementLectureService.quantiteFaiteCumuleeLotFeuille(noeud.lotId());
    }

    private AvancementPhysiqueDto toDto(AvancementPhysique row, Chantier chantier) {
        UUID tenantId = tenantId();
        String lotCode = null;
        String lotDesignation = null;
        BigDecimal quantitePrevue = null;
        BigDecimal cumul = BigDecimal.ZERO;

        if (StringUtils.hasText(row.getPosteId())) {
            PosteBudgetaire poste = posteRepository.findByIdAndTenantId(row.getPosteId(), tenantId).orElse(null);
            if (poste != null) {
                quantitePrevue = poste.getQuantite();
            }
            cumul = avancementLectureService.quantiteFaiteCumuleePoste(row.getPosteId());
        } else if (StringUtils.hasText(row.getLotId())) {
            cumul = avancementLectureService.quantiteFaiteCumuleeLotFeuille(row.getLotId());
        }
        if (StringUtils.hasText(row.getLotId())) {
            ChantierLot lot = lotRepository.findByIdAndTenantId(row.getLotId(), tenantId).orElse(null);
            if (lot != null) {
                lotCode = lot.getCode();
                lotDesignation = lot.getDesignation();
                if (quantitePrevue == null && !StringUtils.hasText(row.getPosteId())) {
                    quantitePrevue = lot.getQuantite();
                }
            }
        }

        BigDecimal pourcentage = AvancementLectureService.pourcentage(quantitePrevue, cumul);
        BigDecimal resteAFaire = quantitePrevue != null
                ? quantitePrevue.subtract(cumul).max(BigDecimal.ZERO)
                : null;

        return AvancementPhysiqueDto.builder()
                .id(row.getId())
                .chantierId(row.getChantierId())
                .chantierCode(chantier.getCode())
                .chantierName(chantier.getLabel())
                .lotId(row.getLotId())
                .lotCode(lotCode)
                .lotDesignation(lotDesignation)
                .posteId(row.getPosteId())
                .date(row.getDateSaisie())
                .quantiteRealisee(row.getQuantiteRealisee())
                .cumulQuantite(cumul)
                .quantitePrevue(quantitePrevue)
                .pourcentage(pourcentage)
                .resteAFaire(resteAFaire)
                .saisieParId(row.getSaisieParId())
                .saisieParName(row.getSaisieParName())
                .notes(row.getNotes())
                .status(row.getStatus())
                .photosCount(0)
                .createdAt(row.getCreatedAt())
                .updatedAt(row.getUpdatedAt())
                .build();
    }

    private static String progressKey(String lotId, String posteId) {
        return (lotId != null ? lotId : "") + "::" + (posteId != null ? posteId : "");
    }

    private static String buildId(String chantierId) {
        return chantierId + "-av-" + UUID.randomUUID();
    }

    private static String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    /** Le nœud feuille d'une déclaration (AC-1) : soit un poste, soit un lot sans enfant. */
    private record Noeud(String lotId, String posteId, BigDecimal quantitePrevue, NatureLigne nature) {
        String id() {
            return posteId != null ? posteId : lotId;
        }
    }
}
