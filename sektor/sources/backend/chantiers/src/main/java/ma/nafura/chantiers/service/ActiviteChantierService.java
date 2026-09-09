package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.ActiviteChantierDto;
import ma.nafura.chantiers.api.dto.ActivitePlanningDto;
import ma.nafura.chantiers.api.dto.ActivitePrecedenceDto;
import ma.nafura.chantiers.api.dto.ActiviteRattachementDto;
import ma.nafura.chantiers.api.request.ActiviteChantierCreateDto;
import ma.nafura.chantiers.api.request.ActiviteChantierUpdateDto;
import ma.nafura.chantiers.api.request.ActivitePrecedenceCreateDto;
import ma.nafura.chantiers.api.request.ActiviteRattachementCreateDto;
import ma.nafura.chantiers.domain.activite.ActiviteChantier;
import ma.nafura.chantiers.domain.activite.ActiviteForme;
import ma.nafura.chantiers.domain.activite.ActiviteNature;
import ma.nafura.chantiers.domain.activite.ActivitePrecedence;
import ma.nafura.chantiers.domain.activite.ActiviteRattachement;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.repository.ActiviteChantierRepository;
import ma.nafura.chantiers.repository.ActiviteNatureRepository;
import ma.nafura.chantiers.repository.ActivitePrecedenceRepository;
import ma.nafura.chantiers.repository.ActiviteRattachementRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.chantiers.repository.ZoneChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Domaine + API activités — CONTRAT planning-activites AC-1..AC-7, étendu L1 (SEKTOR-325).
 * Pas de génération depuis l'arbre / zones (AC-2, AC-5). Quotité = quantité prévue (AC-6, AC-7).
 * Calendrier ouvré réel = SEKTOR-326 (fuseau IANA, semaine type, exceptions).
 */
@Service
public class ActiviteChantierService {

    static final String ERR_DATES = "chantiers.activite.dates_invalides";
    static final String ERR_PARENT = "chantiers.activite.parent_introuvable";
    static final String ERR_ZONE = "chantiers.activite.zone_hors_chantier";
    static final String ERR_CYCLE_WBS = "chantiers.activite.cycle_wbs";
    static final String ERR_NOEUD = "chantiers.activite.noeud_requis";
    static final String ERR_QUOTITE = "chantiers.activite.quotite_depassement";
    static final String ERR_QTY_PREVUE = "chantiers.activite.noeud_sans_quantite_prevue";
    static final String ERR_LIEN = "chantiers.activite.type_lien_invalide";
    static final String ERR_CYCLE_PREC = "chantiers.activite.cycle_precedence";
    static final String ERR_SAME = "chantiers.activite.precedence_meme_activite";
    static final String ERR_JALON_JOUR_FICTIF = "chantiers.activite.jalon_jour_fictif";
    static final String ERR_PHASE_QUANTITE = "chantiers.activite.phase_sans_quantite";
    static final String ERR_PHASE_DUREE = "chantiers.activite.phase_duree_manuelle";
    static final String ERR_SANS_QUANTITE = "chantiers.activite.forme_sans_quantite";
    static final String ERR_NATURE_INCONNUE = "chantiers.activite.nature_inconnue";
    static final String ERR_NATURE_INACTIVE = "chantiers.activite.nature_inactive";
    static final String ERR_NATURE_FORME = "chantiers.activite.nature_incompatible";
    static final String ERR_DUREE_OU_DATES = "chantiers.activite.duree_ou_dates_requises";
    static final String ERR_DUREE = "chantiers.activite.duree_invalide";

    private final ActiviteChantierRepository activiteRepository;
    private final ActivitePrecedenceRepository precedenceRepository;
    private final ActiviteRattachementRepository rattachementRepository;
    private final ActiviteNatureRepository natureRepository;
    private final ChantierService chantierService;
    private final ZoneChantierRepository zoneRepository;
    private final ChantierLotRepository lotRepository;
    private final PosteBudgetaireRepository posteRepository;
    private final CalendrierChantierService calendrierService;
    private final PlanningPolicy planningPolicy;

    public ActiviteChantierService(
            ActiviteChantierRepository activiteRepository,
            ActivitePrecedenceRepository precedenceRepository,
            ActiviteRattachementRepository rattachementRepository,
            ActiviteNatureRepository natureRepository,
            ChantierService chantierService,
            ZoneChantierRepository zoneRepository,
            ChantierLotRepository lotRepository,
            PosteBudgetaireRepository posteRepository,
            CalendrierChantierService calendrierService,
            PlanningPolicy planningPolicy) {
        this.activiteRepository = activiteRepository;
        this.precedenceRepository = precedenceRepository;
        this.rattachementRepository = rattachementRepository;
        this.natureRepository = natureRepository;
        this.chantierService = chantierService;
        this.zoneRepository = zoneRepository;
        this.lotRepository = lotRepository;
        this.posteRepository = posteRepository;
        this.calendrierService = calendrierService;
        this.planningPolicy = planningPolicy;
    }

    @Transactional(readOnly = true)
    public ActivitePlanningDto planning(String chantierId) {
        planningPolicy.assertCanRead(chantierId);
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        List<ActiviteChantier> all =
                activiteRepository.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenantId, chantierId);
        List<ActiviteChantierDto> activites = all.stream()
                .map(a -> toDto(a, rattachementRepository.findByTenantIdAndActiviteId(tenantId, a.getId()), all))
                .toList();
        List<ActivitePrecedenceDto> precedences = precedenceRepository
                .findByTenantIdAndChantierId(tenantId, chantierId)
                .stream()
                .map(ActiviteChantierService::toPrecedenceDto)
                .toList();
        return ActivitePlanningDto.builder()
                .activites(activites)
                .precedences(precedences)
                .capacites(planningPolicy.capacites(chantierId))
                .build();
    }

    @Transactional(readOnly = true)
    public List<ActiviteChantierDto> list(String chantierId) {
        return planning(chantierId).getActivites();
    }

    @Transactional(readOnly = true)
    public ActiviteChantierDto get(String chantierId, String activiteId) {
        ActiviteChantier entity = requireActivite(chantierId, activiteId);
        UUID tenantId = tenantId();
        List<ActiviteChantier> all =
                activiteRepository.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenantId, chantierId);
        return toDto(entity, rattachementRepository.findByTenantIdAndActiviteId(tenantId, entity.getId()), all);
    }

    @Transactional
    public ActiviteChantierDto create(String chantierId, ActiviteChantierCreateDto request) {
        planningPolicy.assertCanEditStructure(chantierId);
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        ActiviteForme forme = ActiviteForme.orDefault(ActiviteForme.parse(request.getForme()));
        var specific = request.getCalendrierSpecifique();
        if (specific != null) {
            planningPolicy.assertCanAdministerCalendar(chantierId);
            specific.calculator();
        }
        VisibleDates dates = resolveWriteDates(
                chantierId, forme, request.getDateDebut(), request.getDateFin(), request.getDureeMinutesOuvrees(), specific);
        String parentId = trimOrNull(request.getParentActiviteId());
        if (parentId != null) {
            requireActivite(chantierId, parentId);
        }
        String zoneId = resolveZone(chantierId, request.getZoneId());
        int ordre = request.getOrdre() != null
                ? request.getOrdre()
                : (int) activiteRepository.countByTenantIdAndChantierId(tenantId, chantierId) + 1;
        ActiviteChantier entity = ActiviteChantier.builder()
                .id(UUID.randomUUID().toString())
                .tenantId(tenantId)
                .chantierId(chantierId)
                .parentActiviteId(parentId)
                .zoneId(zoneId)
                .libelle(request.getLibelle().trim())
                .code(trimOrNull(request.getCode()))
                .forme(forme)
                .natureCode(resolveNatureCode(forme, request.getNatureCode(), null))
                .dateDebut(dates.debut())
                .dateFin(dates.fin())
                .dureeMinutesOuvrees(dates.dureeMinutes())
                .calendrierSpecifique(specific)
                .ordre(ordre)
                .status(StringUtils.hasText(request.getStatus())
                        ? request.getStatus().trim()
                        : ActiviteChantier.STATUS_PLANIFIE)
                .build();
        ActiviteChantier saved = activiteRepository.save(entity);
        List<ActiviteChantier> all =
                activiteRepository.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenantId, chantierId);
        return toDto(saved, List.of(), all);
    }

    @Transactional
    public ActiviteChantierDto update(String chantierId, String activiteId, ActiviteChantierUpdateDto request) {
        planningPolicy.assertCanEditStructure(chantierId);
        ActiviteChantier entity = requireActivite(chantierId, activiteId);
        UUID tenantId = tenantId();
        if (request.getLibelle() != null) {
            entity.setLibelle(request.getLibelle().trim());
        }
        if (request.getCode() != null) {
            entity.setCode(trimOrNull(request.getCode()));
        }
        ActiviteForme forme = entity.getForme() != null ? entity.getForme() : ActiviteForme.ACTIVITE;
        if (request.getForme() != null) {
            forme = ActiviteForme.orDefault(ActiviteForme.parse(request.getForme()));
            List<ActiviteRattachement> rattachements =
                    rattachementRepository.findByTenantIdAndActiviteId(tenantId, activiteId);
            guardFormeQuantite(forme, rattachements);
            entity.setForme(forme);
        }
        if (request.getCalendrierSpecifique() != null || Boolean.TRUE.equals(request.getUtiliserCalendrierChantier())) {
            planningPolicy.assertCanAdministerCalendar(chantierId);
            if (request.getCalendrierSpecifique() != null) request.getCalendrierSpecifique().calculator();
            entity.setCalendrierSpecifique(Boolean.TRUE.equals(request.getUtiliserCalendrierChantier()) ? null : request.getCalendrierSpecifique());
        }
        boolean datesTouched = request.getDateDebut() != null
                || request.getDateFin() != null
                || request.getDureeMinutesOuvrees() != null
                || request.getForme() != null;
        if (datesTouched) {
            LocalDate debut = request.getDateDebut() != null ? request.getDateDebut() : entity.getDateDebut();
            LocalDate fin;
            if (forme.estJalon() && request.getDateDebut() != null && request.getDateFin() == null) {
                fin = debut;
            } else {
                fin = request.getDateFin() != null ? request.getDateFin()
                        : Boolean.TRUE.equals(request.getRecalculerFin()) ? null : entity.getDateFin();
            }
            Integer duree = request.getDureeMinutesOuvrees() != null
                    ? request.getDureeMinutesOuvrees()
                    : entity.getDureeMinutesOuvrees();
            VisibleDates dates = resolveWriteDates(chantierId, forme, debut, fin, duree, entity.getCalendrierSpecifique());
            entity.setDateDebut(dates.debut());
            entity.setDateFin(dates.fin());
            entity.setDureeMinutesOuvrees(dates.dureeMinutes());
        } else {
            validateDates(entity.getDateDebut(), entity.getDateFin());
        }
        if (request.getNatureCode() != null) {
            entity.setNatureCode(resolveNatureCode(forme, request.getNatureCode(), entity.getNatureCode()));
        } else if (request.getForme() != null && entity.getNatureCode() != null) {
            entity.setNatureCode(resolveNatureCode(forme, entity.getNatureCode(), entity.getNatureCode()));
        }
        if (request.getParentActiviteId() != null) {
            String parentId = trimOrNull(request.getParentActiviteId());
            if (parentId != null) {
                if (parentId.equals(activiteId)) {
                    throw new IllegalArgumentException(ERR_CYCLE_WBS);
                }
                requireActivite(chantierId, parentId);
                guardWbsCycle(chantierId, activiteId, parentId);
            }
            entity.setParentActiviteId(parentId);
        }
        if (request.getZoneId() != null) {
            entity.setZoneId(resolveZone(chantierId, request.getZoneId()));
        }
        if (request.getOrdre() != null) {
            entity.setOrdre(request.getOrdre());
        }
        if (StringUtils.hasText(request.getStatus())) {
            entity.setStatus(request.getStatus().trim());
        }
        if (request.getAvancementPercent() != null) {
            List<ActiviteRattachement> rattachements =
                    rattachementRepository.findByTenantIdAndActiviteId(tenantId, activiteId);
            if (!rattachements.isEmpty()) {
                throw new IllegalArgumentException(
                        "chantiers.activite.avancement_percent_interdit_si_rattachee");
            }
            entity.setAvancementPercent(request.getAvancementPercent());
        }
        ActiviteChantier saved = activiteRepository.save(entity);
        List<ActiviteChantier> all =
                activiteRepository.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenantId, chantierId);
        return toDto(saved, rattachementRepository.findByTenantIdAndActiviteId(tenantId, activiteId), all);
    }

    @Transactional
    public void delete(String chantierId, String activiteId) {
        planningPolicy.assertCanEditStructure(chantierId);
        ActiviteChantier entity = requireActivite(chantierId, activiteId);
        UUID tenantId = tenantId();
        // enfants → orphelins (ON DELETE SET NULL en SQL) ; rattachements / précédences CASCADE
        List<ActiviteChantier> children = activiteRepository
                .findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenantId, chantierId)
                .stream()
                .filter(a -> activiteId.equals(a.getParentActiviteId()))
                .toList();
        for (ActiviteChantier child : children) {
            child.setParentActiviteId(null);
            activiteRepository.save(child);
        }
        activiteRepository.delete(entity);
    }

    @Transactional
    public ActiviteRattachementDto rattacher(String chantierId, String activiteId, ActiviteRattachementCreateDto request) {
        planningPolicy.assertCanEditStructure(chantierId);
        ActiviteChantier activite = requireActivite(chantierId, activiteId);
        ActiviteForme forme = ActiviteForme.orDefault(activite.getForme());
        if (!forme.porteQuantite()) {
            throw new IllegalArgumentException(forme.estPhase() ? ERR_PHASE_QUANTITE : ERR_SANS_QUANTITE);
        }
        UUID tenantId = tenantId();
        if (request.getQuantitePrevue() == null || request.getQuantitePrevue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("chantiers.activite.quantite_prevue_positive_requise");
        }

        String posteId = trimOrNull(request.getPosteId());
        String lotIdRequest = trimOrNull(request.getLotId());
        final String lotId;
        BigDecimal quantiteNoeud;

        if (posteId != null) {
            PosteBudgetaire poste = posteRepository
                    .findByIdAndTenantId(posteId, tenantId)
                    .orElseThrow(() -> new IllegalArgumentException("Poste not found: " + posteId));
            ChantierLot lot = lotRepository
                    .findByIdAndTenantId(poste.getLotId(), tenantId)
                    .filter(l -> chantierId.equals(l.getChantierId()))
                    .orElseThrow(() -> new IllegalArgumentException("Poste hors chantier: " + posteId));
            lotId = lot.getId();
            quantiteNoeud = poste.getQuantite();
            BigDecimal deja = rattachementRepository.sommeQuantitePrevuePoste(tenantId, posteId);
            garderQuotite(quantiteNoeud, deja, request.getQuantitePrevue(), posteId);
        } else if (lotIdRequest != null) {
            ChantierLot lot = lotRepository
                    .findByIdAndTenantId(lotIdRequest, tenantId)
                    .filter(l -> chantierId.equals(l.getChantierId()))
                    .orElseThrow(() -> new IllegalArgumentException("Lot not found: " + lotIdRequest));
            boolean aDesSousLots = !lotRepository.findByTenantIdAndParentLotId(tenantId, lotIdRequest).isEmpty();
            boolean aDesPostes =
                    !posteRepository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(tenantId, lotIdRequest).isEmpty();
            if (aDesSousLots || aDesPostes) {
                throw new IllegalArgumentException("chantiers.activite.lot_a_des_enfants: " + lotIdRequest);
            }
            lotId = lot.getId();
            quantiteNoeud = lot.getQuantite();
            BigDecimal deja = rattachementRepository.sommeQuantitePrevueLotFeuille(tenantId, lotIdRequest);
            garderQuotite(quantiteNoeud, deja, request.getQuantitePrevue(), lotIdRequest);
        } else {
            throw new IllegalArgumentException(ERR_NOEUD);
        }

        ActiviteRattachement entity = ActiviteRattachement.builder()
                .id(UUID.randomUUID().toString())
                .tenantId(tenantId)
                .activiteId(activiteId)
                .lotId(lotId)
                .posteId(posteId)
                .quantitePrevue(request.getQuantitePrevue())
                .build();
        return toRattachementDto(rattachementRepository.save(entity));
    }

    @Transactional
    public void detacher(String chantierId, String activiteId, String rattachementId) {
        planningPolicy.assertCanEditStructure(chantierId);
        requireActivite(chantierId, activiteId);
        ActiviteRattachement ratt = rattachementRepository
                .findByIdAndTenantId(rattachementId, tenantId())
                .filter(r -> activiteId.equals(r.getActiviteId()))
                .orElseThrow(() -> new IllegalArgumentException("Rattachement introuvable: " + rattachementId));
        rattachementRepository.delete(ratt);
    }

    @Transactional
    public ActivitePrecedenceDto lier(String chantierId, ActivitePrecedenceCreateDto request) {
        planningPolicy.assertCanEditStructure(chantierId);
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        String pred = request.getPredActiviteId().trim();
        String succ = request.getSuccActiviteId().trim();
        if (pred.equals(succ)) {
            throw new IllegalArgumentException(ERR_SAME);
        }
        requireActivite(chantierId, pred);
        requireActivite(chantierId, succ);
        String type = StringUtils.hasText(request.getTypeLien())
                ? request.getTypeLien().trim().toUpperCase()
                : ActivitePrecedence.FD;
        if (!Set.of(ActivitePrecedence.FD, ActivitePrecedence.DD, ActivitePrecedence.FF, ActivitePrecedence.DF)
                .contains(type)) {
            throw new IllegalArgumentException(ERR_LIEN + ": " + type);
        }
        guardPrecedenceCycle(chantierId, pred, succ);
        ActivitePrecedence entity = ActivitePrecedence.builder()
                .id(UUID.randomUUID().toString())
                .tenantId(tenantId)
                .chantierId(chantierId)
                .predActiviteId(pred)
                .succActiviteId(succ)
                .typeLien(type)
                .build();
        return toPrecedenceDto(precedenceRepository.save(entity));
    }

    @Transactional
    public void delier(String chantierId, String precedenceId) {
        planningPolicy.assertCanEditStructure(chantierId);
        chantierService.getById(chantierId);
        ActivitePrecedence prec = precedenceRepository
                .findByIdAndTenantId(precedenceId, tenantId())
                .filter(p -> chantierId.equals(p.getChantierId()))
                .orElseThrow(() -> new IllegalArgumentException("Precedence introuvable: " + precedenceId));
        precedenceRepository.delete(prec);
    }

    ActiviteChantier requireActivite(String chantierId, String activiteId) {
        planningPolicy.assertCanRead(chantierId);
        chantierService.getById(chantierId);
        return activiteRepository
                .findByIdAndTenantId(activiteId, tenantId())
                .filter(a -> chantierId.equals(a.getChantierId()))
                .orElseThrow(() -> new IllegalArgumentException("Activite introuvable: " + activiteId));
    }

    private void garderQuotite(
            BigDecimal quantiteNoeud, BigDecimal dejaAlloue, BigDecimal demande, String noeudId) {
        if (quantiteNoeud == null || quantiteNoeud.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(ERR_QTY_PREVUE + ": " + noeudId);
        }
        BigDecimal deja = dejaAlloue != null ? dejaAlloue : BigDecimal.ZERO;
        if (deja.add(demande).compareTo(quantiteNoeud) > 0) {
            BigDecimal reste = quantiteNoeud.subtract(deja).max(BigDecimal.ZERO);
            throw new IllegalArgumentException(
                    ERR_QUOTITE + ": reste=" + reste + " noeud=" + noeudId + " demande=" + demande);
        }
    }

    private String resolveZone(String chantierId, String zoneIdRaw) {
        String zoneId = trimOrNull(zoneIdRaw);
        if (zoneId == null) {
            return null;
        }
        zoneRepository
                .findByIdAndTenantId(zoneId, tenantId())
                .filter(z -> chantierId.equals(z.getChantierId()))
                .orElseThrow(() -> new IllegalArgumentException(ERR_ZONE + ": " + zoneId));
        return zoneId;
    }

    private void guardWbsCycle(String chantierId, String activiteId, String newParentId) {
        UUID tenantId = tenantId();
        Map<String, String> parentById = new HashMap<>();
        for (ActiviteChantier a :
                activiteRepository.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenantId, chantierId)) {
            parentById.put(a.getId(), a.getParentActiviteId());
        }
        parentById.put(activiteId, newParentId);
        String cursor = newParentId;
        Set<String> seen = new HashSet<>();
        while (cursor != null) {
            if (!seen.add(cursor)) {
                throw new IllegalArgumentException(ERR_CYCLE_WBS);
            }
            if (activiteId.equals(cursor)) {
                throw new IllegalArgumentException(ERR_CYCLE_WBS);
            }
            cursor = parentById.get(cursor);
        }
    }

    private void guardPrecedenceCycle(String chantierId, String pred, String succ) {
        UUID tenantId = tenantId();
        Map<String, List<String>> successors = new HashMap<>();
        for (ActivitePrecedence p : precedenceRepository.findByTenantIdAndChantierId(tenantId, chantierId)) {
            successors
                    .computeIfAbsent(p.getPredActiviteId(), k -> new ArrayList<>())
                    .add(p.getSuccActiviteId());
        }
        successors.computeIfAbsent(pred, k -> new ArrayList<>()).add(succ);
        // BFS from succ : if we reach pred, cycle
        ArrayDeque<String> queue = new ArrayDeque<>();
        Set<String> visited = new HashSet<>();
        queue.add(succ);
        while (!queue.isEmpty()) {
            String current = queue.poll();
            if (!visited.add(current)) {
                continue;
            }
            if (pred.equals(current)) {
                throw new IllegalArgumentException(ERR_CYCLE_PREC);
            }
            for (String next : successors.getOrDefault(current, List.of())) {
                queue.add(next);
            }
        }
    }

    private static void validateDates(LocalDate debut, LocalDate fin) {
        if (debut == null || fin == null || fin.isBefore(debut)) {
            throw new IllegalArgumentException(ERR_DATES);
        }
    }

    /**
     * Écriture : jalon durée 0 et début=fin ; refus d'un jalon d'un jour fictif (durée &gt; 0
     * ou dates distinctes). Phase : pas de durée manuelle. Activité : dates explicites
     * <em>ou</em> début+durée (fin dérivée du calendrier chantier, SEKTOR-326). Dates
     * explicites = dates visibles inchangées (fin incluse) — pas de recalcul de masse.
     */
    VisibleDates resolveWriteDates(
            String chantierId, ActiviteForme forme, LocalDate debut, LocalDate fin, Integer duree) {
        return resolveWriteDates(chantierId, forme, debut, fin, duree, null);
    }

    private VisibleDates resolveWriteDates(String chantierId, ActiviteForme forme, LocalDate debut, LocalDate fin, Integer duree,
            ma.nafura.chantiers.domain.calendrier.CalendrierActivite specific) {
        ActiviteForme resolved = ActiviteForme.orDefault(forme);
        if (debut == null) {
            throw new IllegalArgumentException(ERR_DATES);
        }
        if (duree != null && duree < 0) {
            throw new IllegalArgumentException(ERR_DUREE);
        }
        if (resolved.estJalon()) {
            if (duree != null && duree != 0) {
                throw new IllegalArgumentException(ERR_JALON_JOUR_FICTIF);
            }
            if (fin != null && !fin.equals(debut)) {
                throw new IllegalArgumentException(ERR_JALON_JOUR_FICTIF);
            }
            return new VisibleDates(debut, debut, 0);
        }
        if (resolved.estPhase()) {
            if (duree != null && duree != 0) {
                throw new IllegalArgumentException(ERR_PHASE_DUREE);
            }
            LocalDate finPhase = fin != null ? fin : debut;
            validateDates(debut, finPhase);
            return new VisibleDates(debut, finPhase, null);
        }
        if (fin != null) {
            validateDates(debut, fin);
            return new VisibleDates(debut, fin, duree);
        }
        if (duree == null) {
            throw new IllegalArgumentException(ERR_DUREE_OU_DATES);
        }
        return new VisibleDates(debut, specific == null ? calendrierService.deriveInclusiveFin(chantierId, debut, duree)
                : specific.calculator().deriveInclusiveFin(debut, duree), duree);
    }

    private String resolveNatureCode(ActiviteForme forme, String natureCodeRaw, String currentCode) {
        String code = trimOrNull(natureCodeRaw);
        if (code == null) {
            return null;
        }
        if (currentCode != null && code.equals(currentCode)) {
            return currentCode;
        }
        ActiviteNature nature = natureRepository
                .findById(code)
                .orElseThrow(() -> new IllegalArgumentException(ERR_NATURE_INCONNUE + ": " + code));
        if (!nature.isActif()) {
            throw new IllegalArgumentException(ERR_NATURE_INACTIVE + ": " + code);
        }
        if (!nature.applicableA(forme)) {
            throw new IllegalArgumentException(ERR_NATURE_FORME + ": " + code);
        }
        return nature.getCode();
    }

    private void guardFormeQuantite(ActiviteForme forme, List<ActiviteRattachement> rattachements) {
        if (!forme.porteQuantite() && rattachements != null && !rattachements.isEmpty()) {
            throw new IllegalArgumentException(forme.estPhase() ? ERR_PHASE_QUANTITE : ERR_SANS_QUANTITE);
        }
    }

    private ActiviteChantierDto toDto(
            ActiviteChantier entity, List<ActiviteRattachement> rattachements, List<ActiviteChantier> all) {
        ActiviteForme forme = ActiviteForme.orDefault(entity.getForme());
        LocalDate debut = entity.getDateDebut();
        LocalDate fin = entity.getDateFin();
        if (forme.estPhase()) {
            VisibleDates derived = derivePhaseDates(entity.getId(), all != null ? all : List.of());
            if (derived != null) {
                debut = derived.debut();
                fin = derived.fin();
            }
        }
        return ActiviteChantierDto.builder()
                .id(entity.getId())
                .chantierId(entity.getChantierId())
                .parentActiviteId(entity.getParentActiviteId())
                .zoneId(entity.getZoneId())
                .libelle(entity.getLibelle())
                .code(entity.getCode())
                .forme(forme.name())
                .natureCode(entity.getNatureCode())
                .dateDebut(debut)
                .dateFin(fin)
                .dureeMinutesOuvrees(forme.estPhase() ? null : entity.getDureeMinutesOuvrees())
                .calendrierSpecifique(entity.getCalendrierSpecifique())
                .planningAllocations(entity.getPlanningAllocations())
                .ordre(entity.getOrdre())
                .avancementPercent(entity.getAvancementPercent())
                .status(entity.getStatus())
                .rattachements(rattachements.stream().map(ActiviteChantierService::toRattachementDto).toList())
                .build();
    }

    /**
     * Dates de phase = min début / max fin des enfants (récursif), à la lecture seulement.
     * Sans enfant : dates stockées (repli, non recalculées).
     */
    VisibleDates derivePhaseDates(String phaseId, List<ActiviteChantier> all) {
        List<ActiviteChantier> children = all.stream()
                .filter(a -> phaseId.equals(a.getParentActiviteId()))
                .toList();
        if (children.isEmpty()) {
            return null;
        }
        LocalDate min = null;
        LocalDate max = null;
        for (ActiviteChantier child : children) {
            LocalDate d = child.getDateDebut();
            LocalDate f = child.getDateFin();
            if (ActiviteForme.orDefault(child.getForme()).estPhase()) {
                VisibleDates nested = derivePhaseDates(child.getId(), all);
                if (nested != null) {
                    d = nested.debut();
                    f = nested.fin();
                }
            }
            if (d != null && (min == null || d.isBefore(min))) {
                min = d;
            }
            if (f != null && (max == null || f.isAfter(max))) {
                max = f;
            }
        }
        if (min == null || max == null) {
            return null;
        }
        return new VisibleDates(min, max, null);
    }

    record VisibleDates(LocalDate debut, LocalDate fin, Integer dureeMinutes) {}

    private static ActiviteRattachementDto toRattachementDto(ActiviteRattachement r) {
        return ActiviteRattachementDto.builder()
                .id(r.getId())
                .activiteId(r.getActiviteId())
                .lotId(r.getLotId())
                .posteId(r.getPosteId())
                .quantitePrevue(r.getQuantitePrevue())
                .build();
    }

    private static ActivitePrecedenceDto toPrecedenceDto(ActivitePrecedence p) {
        return ActivitePrecedenceDto.builder()
                .id(p.getId())
                .chantierId(p.getChantierId())
                .predActiviteId(p.getPredActiviteId())
                .succActiviteId(p.getSuccActiviteId())
                .typeLien(p.getTypeLien())
                .build();
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
}
