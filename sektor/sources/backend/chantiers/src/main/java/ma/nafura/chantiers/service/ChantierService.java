package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import ma.nafura.chantiers.api.dto.ChantierLookupDto;
import ma.nafura.chantiers.api.request.ChantierCreateDto;
import ma.nafura.chantiers.api.request.ChantierDemarrerOsDto;
import ma.nafura.chantiers.api.request.ChantierUpdateDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierRoleCodes;
import ma.nafura.chantiers.domain.chantier.JournalChantier;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.chantiers.repository.JournalChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import ma.nafura.chantiers.seeders.ChantierSeedService;

@Service
public class ChantierService {

    private static final Pattern CODE_SUFFIX = Pattern.compile("^CH-20\\d{2}-(\\d{3})$", Pattern.CASE_INSENSITIVE);

    private final ChantierRepository repository;
    private final ChantierSeedService seedService;
    private final AvancementLectureService avancementLectureService;
    private final ChantierScopeService scopeService;
    private final ChantierAffectationService affectationService;
    private final ChantierLotRepository lotRepository;
    private final JournalChantierRepository journalRepository;

    public ChantierService(
            ChantierRepository repository,
            ChantierSeedService seedService,
            AvancementLectureService avancementLectureService,
            ChantierScopeService scopeService,
            ChantierAffectationService affectationService,
            ChantierLotRepository lotRepository,
            JournalChantierRepository journalRepository) {
        this.repository = repository;
        this.seedService = seedService;
        this.avancementLectureService = avancementLectureService;
        this.scopeService = scopeService;
        this.affectationService = affectationService;
        this.lotRepository = lotRepository;
        this.journalRepository = journalRepository;
    }

    @Transactional(readOnly = true)
    public List<Chantier> list(String status, String clientId, String societeId, String search) {
        return list(status, clientId, societeId, search, true);
    }

    @Transactional(readOnly = true)
    public List<Chantier> list(
            String status, String clientId, String societeId, String search, boolean hydrateAvancement) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Chantier> rows = loadRows(tenantId, status, clientId, societeId);
        Optional<Set<String>> allowed = scopeService.allowedChantierIdsOrUnrestricted();
        if (allowed.isPresent()) {
            Set<String> ids = allowed.get();
            rows = rows.stream().filter(c -> ids.contains(c.getId())).toList();
        }
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(c -> matchesSearch(c, term)).toList();
        }
        if (hydrateAvancement) {
            rows.forEach(this::hydrateAvancement);
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public List<ChantierLookupDto> lookup(String search) {
        return list(null, null, null, search, false).stream()
                .map(c -> ChantierLookupDto.builder()
                        .id(c.getId())
                        .code(c.getCode())
                        .label(c.getLabel())
                        .status(c.getStatus())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public Chantier getById(String id) {
        seedService.seedIfEmpty();
        Chantier chantier = resolve(id).orElseThrow(() -> new IllegalArgumentException("Chantier not found"));
        scopeService.assertCanAccess(chantier.getId());
        hydrateAvancement(chantier);
        return chantier;
    }

    /** AC-12 — la vente active bascule au marché à la notification, pas à la conversion. */
    @Transactional
    public void basculerVenteVersMarche(String chantierId) {
        if (!StringUtils.hasText(chantierId)) {
            throw new IllegalArgumentException("chantiers.vente.chantier_requis");
        }
        Chantier chantier = resolve(chantierId.trim())
                .orElseThrow(() -> new IllegalArgumentException("Chantier not found"));
        if (Chantier.SOURCE_MARCHE.equals(chantier.getSourceVente())) {
            return;
        }
        chantier.setSourceVente(Chantier.SOURCE_MARCHE);
        chantier.setUpdatedAt(OffsetDateTime.now());
        repository.save(chantier);
    }

    /**
     * AC-2, AC-3, AC-4 — l'avancement du chantier ne se stocke plus : il se lit, pondéré au
     * montant vendu de ses lots racines. Ne persiste rien, {@code avancementPercent} est
     * {@code @Transient}.
     */
    private void hydrateAvancement(Chantier chantier) {
        chantier.setAvancementPercent(avancementLectureService.hydrateArbre(chantier.getId()));
    }

    @Transactional
    public Chantier create(ChantierCreateDto request) {
        return createInterne(request);
    }

    /**
     * Entrée publique de création directe : la provenance commerciale appartient exclusivement
     * à l'adapter de conversion Étude → Chantier et ne peut jamais être fournie par le REST.
     */
    @Transactional
    public Chantier createDirect(ChantierCreateDto request) {
        if (request.getDossierEtudeId() != null
                || request.getDevisId() != null
                || StringUtils.hasText(request.getDevisNumero())
                || request.getDevisVersion() != null
                || request.getDateAcceptation() != null
                || StringUtils.hasText(request.getSourceVente())
                || request.getMontantVenteInitialHt() != null
                || request.getDebourseInitialHt() != null) {
            throw new IllegalArgumentException("chantiers.creation_directe.provenance_interdite");
        }
        return createInterne(request);
    }

    private Chantier createInterne(ChantierCreateDto request) {
        if (!StringUtils.hasText(request.getClientId())) {
            throw new IllegalArgumentException("Client is required");
        }
        UUID tenantId = tenantId();
        // Global PK: never reuse tenant-local sequences (ch-001) or client-provided ids —
        // they collide across tenants and Spring Data treats assigned ids as merge/UPDATE.
        String id = UUID.randomUUID().toString();
        String code = StringUtils.hasText(request.getCode()) ? request.getCode().trim() : nextChantierCode(tenantId);
        OffsetDateTime now = OffsetDateTime.now();
        Chantier entity = Chantier.builder()
                .id(id)
                .tenantId(tenantId)
                .code(code)
                .label(request.getLabel().trim())
                .description(trimOrNull(request.getDescription()))
                .chantierType(resolveType(request.getChantierType()))
                .clientId(request.getClientId().trim())
                .clientName(trimOrNull(request.getClientName()))
                .marcheNumero(trimOrNull(request.getMarcheNumero()))
                .typeCcagT(trimOrNull(request.getTypeCcagT()))
                .moaId(trimOrNull(request.getMoaId()))
                .moeId(trimOrNull(request.getMoeId()))
                .betId(trimOrNull(request.getBetId()))
                .adresse(trimOrNull(request.getAdresse()))
                .ville(trimOrNull(request.getVille()))
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .dateDemarrage(request.getDateDemarrage())
                .dureeMois(request.getDureeMois())
                .dateFinPrevue(request.getDateFinPrevue())
                .dateFinReelle(request.getDateFinReelle())
                .montantHt(defaultAmount(request.getMontantHt()))
                .tauxTva(defaultRate(request.getTauxTva(), new BigDecimal("20")))
                .tauxRg(request.getTauxRg())
                .tauxRas(request.getTauxRas())
                .tauxAvance(request.getTauxAvance())
                // AC-9 — snapshot commercial posé une seule fois, à la conversion. L'édition
                // (ChantierUpdateDto) n'a aucun de ces champs : ils ne peuvent pas être changés.
                .dossierEtudeId(request.getDossierEtudeId())
                .devisId(request.getDevisId())
                .devisNumero(trimOrNull(request.getDevisNumero()))
                .devisVersion(request.getDevisVersion())
                .dateAcceptation(request.getDateAcceptation())
                .sourceVente(trimOrNull(request.getSourceVente()))
                .montantVenteInitialHt(request.getMontantVenteInitialHt())
                .debourseInitialHt(request.getDebourseInitialHt())
                // P2-24 : une création n'accepte que l'état initial — aucun statut non initial
                // n'est transformé silencieusement (TERMINE/RECEPTIONNE/CLOTURE refusés).
                .status(statutInitial(request.getStatus()))
                .societeId(trimOrNull(request.getSocieteId()))
                .active(request.getActive() == null || request.getActive())
                .createdAt(now)
                .updatedAt(now)
                .build();
        return repository.save(entity);
    }

    @Transactional
    public Chantier update(String id, ChantierUpdateDto request) {
        Chantier entity = getById(id);
        if (request.getCode() != null) {
            entity.setCode(request.getCode().trim());
        }
        if (request.getLabel() != null) {
            entity.setLabel(request.getLabel().trim());
        }
        if (request.getDescription() != null) {
            entity.setDescription(trimOrNull(request.getDescription()));
        }
        if (request.getChantierType() != null) {
            entity.setChantierType(resolveType(request.getChantierType()));
        }
        if (request.getClientId() != null) {
            if (!StringUtils.hasText(request.getClientId())) {
                throw new IllegalArgumentException("Client is required");
            }
            entity.setClientId(request.getClientId().trim());
        }
        if (request.getClientName() != null) {
            entity.setClientName(trimOrNull(request.getClientName()));
        }
        if (request.getMarcheNumero() != null) {
            entity.setMarcheNumero(trimOrNull(request.getMarcheNumero()));
        }
        if (request.getTypeCcagT() != null) {
            entity.setTypeCcagT(trimOrNull(request.getTypeCcagT()));
        }
        if (request.getMoaId() != null) {
            entity.setMoaId(trimOrNull(request.getMoaId()));
        }
        if (request.getMoeId() != null) {
            entity.setMoeId(trimOrNull(request.getMoeId()));
        }
        if (request.getBetId() != null) {
            entity.setBetId(trimOrNull(request.getBetId()));
        }
        if (request.getAdresse() != null) {
            entity.setAdresse(trimOrNull(request.getAdresse()));
        }
        if (request.getVille() != null) {
            entity.setVille(trimOrNull(request.getVille()));
        }
        if (request.getLatitude() != null) {
            entity.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            entity.setLongitude(request.getLongitude());
        }
        if (request.getDateDemarrage() != null) {
            entity.setDateDemarrage(request.getDateDemarrage());
        }
        if (request.getDureeMois() != null) {
            entity.setDureeMois(request.getDureeMois());
        }
        if (request.getDateFinPrevue() != null) {
            entity.setDateFinPrevue(request.getDateFinPrevue());
        }
        if (request.getDateFinReelle() != null) {
            entity.setDateFinReelle(request.getDateFinReelle());
        }
        if (request.getMontantHt() != null) {
            entity.setMontantHt(request.getMontantHt());
        }
        if (request.getTauxTva() != null) {
            entity.setTauxTva(request.getTauxTva());
        }
        if (request.getTauxRg() != null) {
            entity.setTauxRg(request.getTauxRg());
        }
        if (request.getTauxRas() != null) {
            entity.setTauxRas(request.getTauxRas());
        }
        if (request.getTauxAvance() != null) {
            entity.setTauxAvance(request.getTauxAvance());
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveBackendStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getSocieteId() != null) {
            entity.setSocieteId(trimOrNull(request.getSocieteId()));
        }
        if (request.getActive() != null) {
            entity.setActive(request.getActive());
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft chantiers can be deleted");
        }
        repository.delete(entity);
    }

    /**
     * AC-6 (cockpit-chantier) — le démarrage passe uniquement par l'ordre de service : référence
     * et date d'effet, commande atomique {@code EN_PREPARATION → EN_COURS}, journalisée.
     *
     * <p>Vérifie d'abord la checklist de préparation (AC-5) : client, référence de vente (si
     * chantier issu d'étude), arbre exploitable, déboursé initial, responsables conducteur +
     * chef de chantier, dates prévues. Le planning n'est jamais exigé (AC-8). Un bloqueur restant
     * renvoie la liste stable des codes ; aucune écriture n'est faite.
     */
    /**
     * AC-6 — le démarrage passe uniquement par l'ordre de service, depuis EN_PREPARATION.
     * BROUILLON n'est jamais démarrable (contrat AC-7 : le chantier naît EN_PREPARATION).
     */
    @Transactional
    public Chantier demarrerAvecOs(String id, ChantierDemarrerOsDto os) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_EN_PREPARATION.equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Chantier cannot be started from status " + entity.getStatus());
        }
        List<String> bloqueurs = bloqueursDePreparation(entity);
        if (!bloqueurs.isEmpty()) {
            throw new PreparationIncompleteException(bloqueurs);
        }
        if (os == null || !StringUtils.hasText(os.getOsReference()) || os.getOsDateEffet() == null) {
            throw new IllegalArgumentException("chantiers.demarrage.os_requis");
        }
        entity.setOsReference(os.getOsReference().trim());
        entity.setOsDateEffet(os.getOsDateEffet());
        entity.setStatus(Chantier.STATUS_EN_COURS);
        if (entity.getDateDemarrage() == null) {
            entity.setDateDemarrage(os.getOsDateEffet());
        }
        Chantier demarre = repository.save(entity);
        journalRepository.save(JournalChantier.builder()
                .id("jrn-" + UUID.randomUUID())
                .tenantId(tenantId())
                .chantierId(demarre.getId())
                .date(os.getOsDateEffet())
                .auteur(acteurCourant())
                .contenu("Démarrage par OS " + os.getOsReference().trim()
                        + " (effet " + os.getOsDateEffet() + ")")
                .type("ORDRE_SERVICE")
                .build());
        return demarre;
    }

    /** Acteur courant — uid, sinon email, sinon system. */
    private static String acteurCourant() {
        UUID userId = UserContext.getUserIdOrNull();
        if (userId != null) {
            return userId.toString();
        }
        String email = UserContext.getUserEmail();
        return StringUtils.hasText(email) ? email : "system";
    }

    /**
     * AC-5 — les contrôleurs bloquants de la préparation, hors OS. Code unique partagé par la
     * checklist du cockpit et la commande de démarrage (P1-5) via {@link PreparationRegles}.
     */
    public List<String> bloqueursDePreparation(Chantier chantier) {
        long nbLots = lotRepository.countByTenantIdAndChantierId(tenantId(), chantier.getId());
        List<ma.nafura.chantiers.api.dto.ChantierAffectationDto> affectations =
                affectationService.listByChantier(chantier.getId());
        boolean aConducteur = affectations.stream()
                .anyMatch(a -> ChantierRoleCodes.BTP_CONDUCTEUR_TRAVAUX.equals(a.getRoleCode()));
        boolean aChef = affectations.stream()
                .anyMatch(a -> ChantierRoleCodes.BTP_CHEF_CHANTIER.equals(a.getRoleCode()));
        return PreparationRegles.bloquants(chantier, nbLots, aConducteur, aChef);
    }

    /** AC-5/AC-7 — la préparation est incomplète : codes stables des bloqueurs à résoudre. */
    public static class PreparationIncompleteException extends RuntimeException {
        private final transient List<String> codes;

        public PreparationIncompleteException(List<String> codes) {
            super("chantiers.demarrage.preparation_incomplete");
            this.codes = List.copyOf(codes);
        }

        public List<String> getCodes() {
            return codes;
        }
    }

    @Transactional
    public Chantier suspendre(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_EN_COURS.equals(entity.getStatus())) {
            throw new IllegalStateException("Only active chantiers can be suspended");
        }
        entity.setStatus(Chantier.STATUS_SUSPENDU);
        return repository.save(entity);
    }

    @Transactional
    public Chantier reprendre(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_SUSPENDU.equals(entity.getStatus())) {
            throw new IllegalStateException("Only suspended chantiers can be resumed");
        }
        entity.setStatus(Chantier.STATUS_EN_COURS);
        return repository.save(entity);
    }

    @Transactional
    public Chantier receptionProvisoire(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_EN_COURS.equals(entity.getStatus())) {
            throw new IllegalStateException("Provisional reception requires EN_COURS status");
        }
        entity.setStatus(Chantier.STATUS_RECEPTION_PROVISOIRE);
        return repository.save(entity);
    }

    @Transactional
    public Chantier receptionDefinitive(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_RECEPTION_PROVISOIRE.equals(entity.getStatus())) {
            throw new IllegalStateException("Final reception requires RECEPTIONNE_PROVISOIRE status");
        }
        entity.setStatus(Chantier.STATUS_RECEPTION_DEFINITIF);
        return repository.save(entity);
    }

    @Transactional
    public Chantier clore(String id) {
        Chantier entity = getById(id);
        if (!Chantier.STATUS_RECEPTION_DEFINITIF.equals(entity.getStatus())) {
            throw new IllegalStateException("Closing requires RECEPTIONNE_DEFINITIF status");
        }
        entity.setStatus(Chantier.STATUS_CLOS);
        entity.setActive(false);
        if (entity.getDateFinReelle() == null) {
            entity.setDateFinReelle(LocalDate.now());
        }
        return repository.save(entity);
    }

    private List<Chantier> loadRows(UUID tenantId, String status, String clientId, String societeId) {
        List<String> backendStatuses = resolveStatusFilter(status);
        boolean hasClient = StringUtils.hasText(clientId);
        boolean hasSociete = StringUtils.hasText(societeId);

        if (backendStatuses != null && !backendStatuses.isEmpty()) {
            List<Chantier> merged = new ArrayList<>();
            for (String backendStatus : backendStatuses) {
                merged.addAll(loadRowsForStatus(tenantId, backendStatus, clientId, societeId, hasClient, hasSociete));
            }
            return merged.stream()
                    .distinct()
                    .sorted((a, b) -> a.getCode().compareToIgnoreCase(b.getCode()))
                    .toList();
        }

        if (hasClient && hasSociete) {
            return repository
                    .findByTenantIdAndClientIdOrderByCodeAsc(tenantId, clientId.trim())
                    .stream()
                    .filter(c -> societeId.trim().equals(c.getSocieteId()))
                    .toList();
        }
        if (hasClient) {
            return repository.findByTenantIdAndClientIdOrderByCodeAsc(tenantId, clientId.trim());
        }
        if (hasSociete) {
            return repository.findByTenantIdAndSocieteIdOrderByCodeAsc(tenantId, societeId.trim());
        }
        return repository.findByTenantIdOrderByCodeAsc(tenantId);
    }

    private List<Chantier> loadRowsForStatus(
            UUID tenantId,
            String backendStatus,
            String clientId,
            String societeId,
            boolean hasClient,
            boolean hasSociete) {
        if (hasClient && hasSociete) {
            return repository
                    .findByTenantIdAndStatusAndClientIdOrderByCodeAsc(tenantId, backendStatus, clientId.trim())
                    .stream()
                    .filter(c -> societeId.trim().equals(c.getSocieteId()))
                    .toList();
        }
        if (hasClient) {
            return repository.findByTenantIdAndStatusAndClientIdOrderByCodeAsc(
                    tenantId, backendStatus, clientId.trim());
        }
        if (hasSociete) {
            return repository.findByTenantIdAndStatusAndSocieteIdOrderByCodeAsc(
                    tenantId, backendStatus, societeId.trim());
        }
        return repository.findByTenantIdAndStatusOrderByCodeAsc(tenantId, backendStatus);
    }

    private List<String> resolveStatusFilter(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if ("PROSPECT".equals(normalized)) {
            return List.of(Chantier.STATUS_BROUILLON, Chantier.STATUS_EN_PREPARATION);
        }
        if ("TERMINE".equals(normalized) || Chantier.STATUS_EN_COURS.equals(normalized)) {
            return List.of(Chantier.STATUS_EN_COURS);
        }
        if (Chantier.STATUS_SUSPENDU.equals(normalized)) {
            return List.of(Chantier.STATUS_SUSPENDU);
        }
        if ("RECEPTIONNE".equals(normalized)) {
            return List.of(Chantier.STATUS_RECEPTION_PROVISOIRE, Chantier.STATUS_RECEPTION_DEFINITIF);
        }
        if ("CLOTURE".equals(normalized) || Chantier.STATUS_CLOS.equals(normalized)) {
            return List.of(Chantier.STATUS_CLOS);
        }
        if ("ANNULE".equals(normalized)) {
            return List.of();
        }
        return List.of(normalized);
    }

    private Optional<Chantier> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        UUID tenantId = tenantId();
        Optional<Chantier> byId = repository.findByIdAndTenantId(id, tenantId);
        if (byId.isPresent()) {
            return byId;
        }
        Optional<Chantier> byCode = repository.findByTenantIdAndCode(tenantId, id);
        if (byCode.isPresent()) {
            return byCode;
        }
        var codeMatch = CODE_SUFFIX.matcher(id);
        if (codeMatch.matches()) {
            String guessed = "ch-" + codeMatch.group(1);
            return repository.findByIdAndTenantId(guessed, tenantId);
        }
        return Optional.empty();
    }

    /**
     * P2-24 — seuls les états initiaux (BROUILLON, EN_PREPARATION) sont acceptés à la création.
     * Un statut non initial demandé est refusé explicitement plutôt que transformé en silence.
     */
    private String statutInitial(String requested) {
        if (!StringUtils.hasText(requested)) {
            return Chantier.STATUS_BROUILLON;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        if (Chantier.STATUS_BROUILLON.equals(normalized)
                || Chantier.STATUS_EN_PREPARATION.equals(normalized)) {
            return normalized;
        }
        throw new IllegalArgumentException("chantiers.creation.statut_initial_invalide");
    }

    private String resolveBackendStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "PROSPECT" -> Chantier.STATUS_EN_PREPARATION;
            case "TERMINE" -> Chantier.STATUS_EN_COURS;
            case "RECEPTIONNE" -> Chantier.STATUS_RECEPTION_PROVISOIRE;
            case "CLOTURE", "ANNULE", Chantier.STATUS_CLOS -> Chantier.STATUS_CLOS;
            case Chantier.STATUS_BROUILLON,
                    Chantier.STATUS_EN_PREPARATION,
                    Chantier.STATUS_EN_COURS,
                    Chantier.STATUS_SUSPENDU,
                    Chantier.STATUS_RECEPTION_PROVISOIRE,
                    Chantier.STATUS_RECEPTION_DEFINITIF -> normalized;
            default -> fallback;
        };
    }

    private String resolveType(String type) {
        return StringUtils.hasText(type) ? type.trim().toUpperCase(Locale.ROOT) : "BATIMENT";
    }

    private String nextChantierCode(UUID tenantId) {
        int year = Year.now().getValue();
        int max = 0;
        for (Chantier c : repository.findByTenantIdOrderByCodeAsc(tenantId)) {
            var m = Pattern.compile("^CH-" + year + "-(\\d+)$", Pattern.CASE_INSENSITIVE).matcher(c.getCode());
            if (m.matches()) {
                max = Math.max(max, Integer.parseInt(m.group(1)));
            }
        }
        return "CH-" + year + "-" + String.format("%03d", max + 1);
    }

    private boolean matchesSearch(Chantier c, String term) {
        return contains(c.getCode(), term)
                || contains(c.getLabel(), term)
                || contains(c.getClientName(), term)
                || contains(c.getVille(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal defaultRate(BigDecimal value, BigDecimal fallback) {
        return value != null ? value : fallback;
    }

    private String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
