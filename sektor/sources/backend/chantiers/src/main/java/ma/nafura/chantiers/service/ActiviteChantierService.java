package ma.nafura.chantiers.service;

import java.math.BigDecimal;
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
import ma.nafura.chantiers.domain.activite.ActivitePrecedence;
import ma.nafura.chantiers.domain.activite.ActiviteRattachement;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.repository.ActiviteChantierRepository;
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
 * Domaine + API activités — CONTRAT planning-activites AC-1..AC-7.
 * Pas de génération depuis l'arbre / zones (AC-2, AC-5). Quotité = quantité prévue (AC-6, AC-7).
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

    private final ActiviteChantierRepository activiteRepository;
    private final ActivitePrecedenceRepository precedenceRepository;
    private final ActiviteRattachementRepository rattachementRepository;
    private final ChantierService chantierService;
    private final ZoneChantierRepository zoneRepository;
    private final ChantierLotRepository lotRepository;
    private final PosteBudgetaireRepository posteRepository;

    public ActiviteChantierService(
            ActiviteChantierRepository activiteRepository,
            ActivitePrecedenceRepository precedenceRepository,
            ActiviteRattachementRepository rattachementRepository,
            ChantierService chantierService,
            ZoneChantierRepository zoneRepository,
            ChantierLotRepository lotRepository,
            PosteBudgetaireRepository posteRepository) {
        this.activiteRepository = activiteRepository;
        this.precedenceRepository = precedenceRepository;
        this.rattachementRepository = rattachementRepository;
        this.chantierService = chantierService;
        this.zoneRepository = zoneRepository;
        this.lotRepository = lotRepository;
        this.posteRepository = posteRepository;
    }

    @Transactional(readOnly = true)
    public ActivitePlanningDto planning(String chantierId) {
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        List<ActiviteChantierDto> activites = activiteRepository
                .findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenantId, chantierId)
                .stream()
                .map(a -> toDto(a, rattachementRepository.findByTenantIdAndActiviteId(tenantId, a.getId())))
                .toList();
        List<ActivitePrecedenceDto> precedences = precedenceRepository
                .findByTenantIdAndChantierId(tenantId, chantierId)
                .stream()
                .map(ActiviteChantierService::toPrecedenceDto)
                .toList();
        return ActivitePlanningDto.builder().activites(activites).precedences(precedences).build();
    }

    @Transactional(readOnly = true)
    public List<ActiviteChantierDto> list(String chantierId) {
        return planning(chantierId).getActivites();
    }

    @Transactional(readOnly = true)
    public ActiviteChantierDto get(String chantierId, String activiteId) {
        ActiviteChantier entity = requireActivite(chantierId, activiteId);
        return toDto(entity, rattachementRepository.findByTenantIdAndActiviteId(tenantId(), entity.getId()));
    }

    @Transactional
    public ActiviteChantierDto create(String chantierId, ActiviteChantierCreateDto request) {
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        validateDates(request.getDateDebut(), request.getDateFin());
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
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .ordre(ordre)
                .status(StringUtils.hasText(request.getStatus())
                        ? request.getStatus().trim()
                        : ActiviteChantier.STATUS_PLANIFIE)
                .build();
        return toDto(activiteRepository.save(entity), List.of());
    }

    @Transactional
    public ActiviteChantierDto update(String chantierId, String activiteId, ActiviteChantierUpdateDto request) {
        ActiviteChantier entity = requireActivite(chantierId, activiteId);
        if (request.getLibelle() != null) {
            entity.setLibelle(request.getLibelle().trim());
        }
        if (request.getDateDebut() != null) {
            entity.setDateDebut(request.getDateDebut());
        }
        if (request.getDateFin() != null) {
            entity.setDateFin(request.getDateFin());
        }
        validateDates(entity.getDateDebut(), entity.getDateFin());
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
                    rattachementRepository.findByTenantIdAndActiviteId(tenantId(), activiteId);
            if (!rattachements.isEmpty()) {
                throw new IllegalArgumentException(
                        "chantiers.activite.avancement_percent_interdit_si_rattachee");
            }
            entity.setAvancementPercent(request.getAvancementPercent());
        }
        return toDto(
                activiteRepository.save(entity),
                rattachementRepository.findByTenantIdAndActiviteId(tenantId(), activiteId));
    }

    @Transactional
    public void delete(String chantierId, String activiteId) {
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
        requireActivite(chantierId, activiteId);
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
        requireActivite(chantierId, activiteId);
        ActiviteRattachement ratt = rattachementRepository
                .findByIdAndTenantId(rattachementId, tenantId())
                .filter(r -> activiteId.equals(r.getActiviteId()))
                .orElseThrow(() -> new IllegalArgumentException("Rattachement introuvable: " + rattachementId));
        rattachementRepository.delete(ratt);
    }

    @Transactional
    public ActivitePrecedenceDto lier(String chantierId, ActivitePrecedenceCreateDto request) {
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
        chantierService.getById(chantierId);
        ActivitePrecedence prec = precedenceRepository
                .findByIdAndTenantId(precedenceId, tenantId())
                .filter(p -> chantierId.equals(p.getChantierId()))
                .orElseThrow(() -> new IllegalArgumentException("Precedence introuvable: " + precedenceId));
        precedenceRepository.delete(prec);
    }

    ActiviteChantier requireActivite(String chantierId, String activiteId) {
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

    private static void validateDates(java.time.LocalDate debut, java.time.LocalDate fin) {
        if (debut == null || fin == null || fin.isBefore(debut)) {
            throw new IllegalArgumentException(ERR_DATES);
        }
    }

    private ActiviteChantierDto toDto(ActiviteChantier entity, List<ActiviteRattachement> rattachements) {
        return ActiviteChantierDto.builder()
                .id(entity.getId())
                .chantierId(entity.getChantierId())
                .parentActiviteId(entity.getParentActiviteId())
                .zoneId(entity.getZoneId())
                .libelle(entity.getLibelle())
                .dateDebut(entity.getDateDebut())
                .dateFin(entity.getDateFin())
                .ordre(entity.getOrdre())
                .avancementPercent(entity.getAvancementPercent())
                .status(entity.getStatus())
                .rattachements(rattachements.stream().map(ActiviteChantierService::toRattachementDto).toList())
                .build();
    }

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
