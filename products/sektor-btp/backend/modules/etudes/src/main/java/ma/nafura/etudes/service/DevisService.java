package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import ma.nafura.etudes.api.request.DevisCreateDto;
import ma.nafura.etudes.api.request.DevisLigneInputDto;
import ma.nafura.etudes.api.request.DevisUpdateDto;
import ma.nafura.etudes.api.dto.ConvertToChantierResultDto;
import ma.nafura.etudes.domain.model.AppelOffreClient;
import ma.nafura.etudes.domain.model.Devis;
import ma.nafura.etudes.domain.model.DevisLigne;
import ma.nafura.etudes.domain.model.DevisVersion;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DevisVersionRepository;
import ma.nafura.etudes.service.port.EtudeClientPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DevisService {

    private static final int MONEY_SCALE = 2;
    private static final Set<String> TERMINAL =
            Set.of(Devis.STATUS_PERDU, Devis.STATUS_ANNULE, Devis.STATUS_EXPIRE);

    private final DevisRepository repository;
    private final DevisVersionRepository versionRepository;
    private final DevisSeedService seedService;
    private final DpgfService dpgfService;
    private final DevisGenerationService generationService;
    private final EtudeClientPort clientPort;
    private final AppelOffreClientRepository aocRepository;
    private final JdbcTemplate jdbcTemplate;

    public DevisService(
            DevisRepository repository,
            DevisVersionRepository versionRepository,
            DevisSeedService seedService,
            DpgfService dpgfService,
            DevisGenerationService generationService,
            EtudeClientPort clientPort,
            AppelOffreClientRepository aocRepository,
            JdbcTemplate jdbcTemplate) {
        this.repository = repository;
        this.versionRepository = versionRepository;
        this.seedService = seedService;
        this.dpgfService = dpgfService;
        this.generationService = generationService;
        this.clientPort = clientPort;
        this.aocRepository = aocRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public List<Devis> list(
            String status,
            String clientId,
            LocalDate dateFrom,
            LocalDate dateTo,
            BigDecimal montantMin,
            BigDecimal montantMax,
            String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Devis> rows = loadRows(tenantId, status, clientId);
        if (dateFrom != null) {
            rows = rows.stream().filter(d -> !d.getDateEmission().isBefore(dateFrom)).toList();
        }
        if (dateTo != null) {
            rows = rows.stream().filter(d -> !d.getDateEmission().isAfter(dateTo)).toList();
        }
        if (montantMin != null) {
            rows = rows.stream()
                    .filter(d -> d.getTotalHt().compareTo(montantMin) >= 0)
                    .toList();
        }
        if (montantMax != null) {
            rows = rows.stream()
                    .filter(d -> d.getTotalHt().compareTo(montantMax) <= 0)
                    .toList();
        }
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(d -> matchesSearch(d, term)).toList();
        }
        rows = rows.stream().map(this::applyExpiryIfNeeded).toList();
        rows.forEach(this::attachLigneDevisRefs);
        return rows;
    }

    @Transactional
    public Devis getById(UUID id) {
        seedService.seedIfEmpty();
        Devis entity = applyExpiryIfNeeded(requireDevis(id));
        attachLigneDevisRefs(entity);
        return entity;
    }

    @Transactional
    public Devis create(DevisCreateDto request) {
        UUID tenantId = tenantId();
        EtudeClientPort.ClientSnapshot client = clientPort.requireClientRole(request.getClientId());
        assertDates(request.getDateEmission(), request.getDateValidite());
        ContactHint contact = resolveContactHint(
                client.id(), request.getContactClientId(), request.getContactClient());
        Devis entity = Devis.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .version(1)
                .clientId(client.id().toString())
                .clientName(client.raisonSociale())
                .contactClient(contact.label())
                .contactClientId(contact.id())
                .objet(request.getObjet().trim())
                .ville(trimOrNull(request.getVille()))
                .dateEmission(request.getDateEmission())
                .dateValidite(request.getDateValidite())
                .metreId(parseUuidOrNull(request.getMetreId()))
                .dpgfId(parseUuidOrNull(request.getDpgfId()))
                .bibliothequeReference(trimOrNull(request.getBibliothequeReference()))
                .conditionsPaiement(request.getConditionsPaiement().trim())
                .delaiExecutionJours(request.getDelaiExecutionJours())
                .tvaTaux(request.getTvaTaux() != null ? request.getTvaTaux() : new BigDecimal("20"))
                .remiseGlobalePercent(request.getRemiseGlobalePercent())
                .status(Devis.STATUS_BROUILLON)
                .notes(trimOrNull(request.getNotes()))
                .lignes(new ArrayList<>())
                .historiqueVersions(new ArrayList<>())
                .build();

        applyLignes(entity, request.getLignes(), tenantId);
        applyTotals(entity);
        return repository.save(entity);
    }

    @Transactional
    public Devis createFromDpgf(UUID dpgfId) {
        throw new IllegalArgumentException("etudes.gate.chiffrage.client_manquant");
    }

    /** Génération depuis un dossier d'étude validé — lie devis ↔ dossier. */
    @Transactional
    public Devis createFromDossier(DossierEtude dossier) {
        if (dossier.getDpgfId() == null) {
            throw new IllegalArgumentException("etudes.dossier.devis_sans_dpgf");
        }
        EtudeClientPort.ClientSnapshot client = clientPort.requireClientRole(dossier.getClientId());
        String ville = resolveVilleFromDossier(dossier).orElse(resolveVilleFromPartner(client.id()).orElse(null));
        ContactHint contact = resolvePrimaryContact(client.id()).orElse(ContactHint.empty());
        return createFromDpgf(
                dossier.getDpgfId(),
                dossier.getId(),
                client.id().toString(),
                client.raisonSociale(),
                ville,
                contact);
    }

    @Transactional
    public Devis createFromDpgf(
            UUID dpgfId, UUID dossierEtudeId, String clientId, String clientName) {
        EtudeClientPort.ClientSnapshot client = clientPort.requireClientRole(clientId);
        ContactHint contact = resolvePrimaryContact(client.id()).orElse(ContactHint.empty());
        String ville = resolveVilleFromPartner(client.id()).orElse(null);
        return createFromDpgf(dpgfId, dossierEtudeId, clientId, clientName, ville, contact);
    }

    private Devis createFromDpgf(
            UUID dpgfId,
            UUID dossierEtudeId,
            String clientId,
            String clientName,
            String ville,
            ContactHint contact) {
        EtudeClientPort.ClientSnapshot client = clientPort.requireClientRole(clientId);
        String resolvedName =
                StringUtils.hasText(clientName) ? clientName.trim() : client.raisonSociale();
        Dpgf dpgf = dpgfService.getById(dpgfId);
        UUID tenantId = tenantId();
        LocalDate today = LocalDate.now();

        Devis entity = Devis.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .version(1)
                .clientId(client.id().toString())
                .clientName(resolvedName)
                .contactClient(contact.label())
                .contactClientId(contact.id())
                .objet(StringUtils.hasText(dpgf.getProjetNom())
                        ? dpgf.getProjetNom()
                        : ("Chiffrage - " + dpgf.getNumero()))
                .ville(trimOrNull(ville))
                .dateEmission(today)
                .dateValidite(today.plusMonths(2))
                .metreId(dpgf.getMetreId())
                .dpgfId(dpgf.getId())
                .dossierEtudeId(dossierEtudeId)
                .bibliothequeReference("DPGF " + dpgf.getNumero())
                .conditionsPaiement("Selon marche / CCAG-T - conditions type")
                .delaiExecutionJours(180)
                .tvaTaux(dpgf.getTvaTaux())
                .status(Devis.STATUS_BROUILLON)
                .lignes(new ArrayList<>())
                .historiqueVersions(new ArrayList<>())
                .build();

        List<DevisLigne> generated = generationService.toDevisLignes(dpgf, null, tenantId);
        for (DevisLigne ligne : generated) {
            ligne.setDevis(entity);
            entity.getLignes().add(ligne);
        }
        applyTotals(entity);
        return repository.save(entity);
    }

    @Transactional
    public Devis update(UUID id, DevisUpdateDto request) {
        Devis entity = requireModifiable(id);
        UUID tenantId = tenantId();

        if (request.getClientId() != null) {
            EtudeClientPort.ClientSnapshot client =
                    clientPort.requireClientRole(request.getClientId());
            entity.setClientId(client.id().toString());
            entity.setClientName(client.raisonSociale());
        }
        if (request.getContactClientId() != null || request.getContactClient() != null) {
            UUID clientUuid = parseUuidOrNull(entity.getClientId());
            ContactHint contact = resolveContactHint(
                    clientUuid, request.getContactClientId(), request.getContactClient());
            entity.setContactClientId(contact.id());
            entity.setContactClient(contact.label());
        }
        if (request.getObjet() != null) {
            entity.setObjet(request.getObjet().trim());
        }
        if (request.getVille() != null) {
            entity.setVille(trimOrNull(request.getVille()));
        }
        if (request.getDateEmission() != null) {
            entity.setDateEmission(request.getDateEmission());
        }
        if (request.getDateValidite() != null) {
            entity.setDateValidite(request.getDateValidite());
        }
        assertDates(entity.getDateEmission(), entity.getDateValidite());
        if (request.getMetreId() != null) {
            entity.setMetreId(parseUuidOrNull(request.getMetreId()));
        }
        if (request.getDpgfId() != null) {
            entity.setDpgfId(parseUuidOrNull(request.getDpgfId()));
        }
        if (request.getBibliothequeReference() != null) {
            entity.setBibliothequeReference(trimOrNull(request.getBibliothequeReference()));
        }
        if (request.getConditionsPaiement() != null) {
            entity.setConditionsPaiement(request.getConditionsPaiement().trim());
        }
        if (request.getDelaiExecutionJours() != null) {
            entity.setDelaiExecutionJours(request.getDelaiExecutionJours());
        }
        if (request.getTvaTaux() != null) {
            entity.setTvaTaux(request.getTvaTaux());
        }
        if (request.getRemiseGlobalePercent() != null) {
            entity.setRemiseGlobalePercent(request.getRemiseGlobalePercent());
        }
        assertRemiseVsMarge(entity);
        // Status changes must go through transition endpoints — ignore request.status.
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getLignes() != null) {
            entity.getLignes().clear();
            applyLignes(entity, request.getLignes(), tenantId);
        }
        applyTotals(entity);
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id) {
        Devis entity = requireModifiable(id);
        repository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<DevisVersion> listVersions(UUID id) {
        requireDevis(id);
        return versionRepository.findByDevisIdAndTenantIdOrderByVersionAsc(id, tenantId());
    }

    @Transactional
    public Devis createVersion(UUID id, String modifications) {
        Devis entity = requireDevis(id);
        if (TERMINAL.contains(entity.getStatus())) {
            throw new IllegalStateException("etudes.devis.version_statut_interdit");
        }
        DevisVersion snapshot = DevisVersion.builder()
                .tenantId(tenantId())
                .devis(entity)
                .version(entity.getVersion())
                .snapshotDate(LocalDate.now())
                .totalHt(entity.getTotalHt())
                .modifications(StringUtils.hasText(modifications)
                        ? modifications.trim()
                        : "Snapshot avant nouvelle version")
                .build();
        entity.getHistoriqueVersions().add(snapshot);
        entity.setVersion(entity.getVersion() + 1);
        entity.setStatus(Devis.STATUS_BROUILLON);
        entity.setMotifRefus(null);
        return repository.save(entity);
    }

    @Transactional
    public Devis submit(UUID id) {
        Devis entity = requireDevis(id);
        if (!Devis.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("etudes.devis.emit_hors_brouillon");
        }
        entity.setStatus(Devis.STATUS_EMIS);
        entity.setMotifRefus(null);
        return repository.save(entity);
    }

    @Transactional
    public Devis negotiate(UUID id) {
        Devis entity = requireDevis(id);
        if (!Devis.STATUS_EMIS.equals(entity.getStatus())) {
            throw new IllegalStateException("etudes.devis.negotiate_hors_emis");
        }
        entity.setStatus(Devis.STATUS_NEGOCIATION);
        return repository.save(entity);
    }

    @Transactional
    public Devis approve(UUID id) {
        Devis entity = requireDevis(id);
        if (!Devis.STATUS_EMIS.equals(entity.getStatus())
                && !Devis.STATUS_NEGOCIATION.equals(entity.getStatus())) {
            throw new IllegalStateException("etudes.devis.approve_hors_etat");
        }
        entity.setStatus(Devis.STATUS_APPROUVE);
        entity.setMotifRefus(null);
        return repository.save(entity);
    }

    /** Alias historique — même effet que {@link #approve}. */
    @Transactional
    public Devis marquerGagne(UUID id) {
        return approve(id);
    }

    @Transactional
    public Devis lose(UUID id, String motif) {
        if (!StringUtils.hasText(motif)) {
            throw new IllegalArgumentException("etudes.devis.motif_perte_requis");
        }
        Devis entity = requireDevis(id);
        if (!Devis.STATUS_EMIS.equals(entity.getStatus())
                && !Devis.STATUS_NEGOCIATION.equals(entity.getStatus())) {
            throw new IllegalStateException("etudes.devis.lose_hors_etat");
        }
        entity.setStatus(Devis.STATUS_PERDU);
        entity.setMotifRefus(motif.trim());
        return repository.save(entity);
    }

    @Transactional
    public Devis cancel(UUID id) {
        Devis entity = requireDevis(id);
        if (Devis.STATUS_APPROUVE.equals(entity.getStatus())
                || TERMINAL.contains(entity.getStatus())) {
            throw new IllegalStateException("etudes.devis.cancel_hors_etat");
        }
        entity.setStatus(Devis.STATUS_ANNULE);
        return repository.save(entity);
    }

    @Transactional
    public ConvertToChantierResultDto convertToChantier(UUID id) {
        requireDevis(id);
        throw new IllegalStateException(
                "etudes.devis.convert_deprecated: utiliser POST /dossiers/{id}/convertir (L13 guichet unique)");
    }

    /**
     * L13 — remise commerciale &gt; marge du dossier = bloquant.
     * Marge : {@code dossier.margePercentDefaut} ou paramètre tenant.
     */
    void assertRemiseVsMarge(Devis entity) {
        BigDecimal remise = entity.getRemiseGlobalePercent();
        if (remise == null || remise.signum() <= 0) {
            return;
        }
        BigDecimal marge = resolveMargeReference(entity);
        if (remise.compareTo(marge) > 0) {
            throw new IllegalArgumentException(
                    "etudes.devis.remise_sup_marge: remise "
                            + remise
                            + " % > marge "
                            + marge
                            + " %");
        }
    }

    private BigDecimal resolveMargeReference(Devis entity) {
        if (entity.getDossierEtudeId() != null) {
            // lazy via JDBC to avoid circular DossierEtudeService dep
            List<BigDecimal> rows = jdbcTemplate.query(
                    "SELECT COALESCE(marge_percent_defaut, marge_globale_percent) FROM dossiers_etude WHERE id = ? AND tenant_id = ?",
                    (rs, i) -> rs.getBigDecimal(1),
                    entity.getDossierEtudeId(),
                    tenantId());
            if (!rows.isEmpty() && rows.getFirst() != null) {
                return rows.getFirst();
            }
        }
        return BigDecimal.valueOf(7); // align ParametresEtudeService.DEFAULT_MARGE
    }

    private Devis applyExpiryIfNeeded(Devis entity) {
        if (entity.getDateValidite() == null) {
            return entity;
        }
        boolean candidacy = Devis.STATUS_EMIS.equals(entity.getStatus())
                || Devis.STATUS_NEGOCIATION.equals(entity.getStatus());
        if (candidacy && entity.getDateValidite().isBefore(LocalDate.now())) {
            entity.setStatus(Devis.STATUS_EXPIRE);
            return repository.save(entity);
        }
        return entity;
    }

    private Devis requireModifiable(UUID id) {
        Devis entity = requireDevis(id);
        if (!Devis.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("etudes.devis.non_modifiable");
        }
        return entity;
    }

    private void assertDates(LocalDate emission, LocalDate validite) {
        if (emission != null && validite != null && validite.isBefore(emission)) {
            throw new IllegalArgumentException("etudes.devis.date_validite_avant_emission");
        }
    }

    private Optional<String> resolveVilleFromDossier(DossierEtude dossier) {
        if (dossier.getAppelOffreClientId() == null) {
            return Optional.empty();
        }
        return aocRepository
                .findByIdAndTenantId(dossier.getAppelOffreClientId(), tenantId())
                .map(AppelOffreClient::getVille)
                .filter(StringUtils::hasText)
                .map(String::trim);
    }

    private Optional<String> resolveVilleFromPartner(UUID partnerId) {
        if (partnerId == null) {
            return Optional.empty();
        }
        List<String> rows = jdbcTemplate.query(
                """
                SELECT ville FROM partner_addresses
                WHERE tenant_id = ? AND partner_id = ?
                  AND ville IS NOT NULL AND trim(ville) <> ''
                ORDER BY CASE WHEN is_default IS TRUE THEN 0 ELSE 1 END, created_at ASC
                LIMIT 1
                """,
                (rs, i) -> rs.getString(1),
                tenantId(),
                partnerId);
        return rows.stream().findFirst();
    }

    private Optional<ContactHint> resolvePrimaryContact(UUID partnerId) {
        if (partnerId == null) {
            return Optional.empty();
        }
        List<ContactHint> rows = jdbcTemplate.query(
                """
                SELECT id, nom, fonction FROM partner_contacts
                WHERE tenant_id = ? AND partner_id = ?
                ORDER BY CASE WHEN is_primary IS TRUE THEN 0 ELSE 1 END, nom ASC
                LIMIT 1
                """,
                (rs, i) -> new ContactHint(
                        (UUID) rs.getObject("id"),
                        formatContactLabel(rs.getString("nom"), rs.getString("fonction"))),
                tenantId(),
                partnerId);
        return rows.stream().findFirst();
    }

    private ContactHint resolveContactHint(UUID partnerId, String contactClientId, String contactClient) {
        UUID contactId = parseUuidOrNull(contactClientId);
        if (contactId != null) {
            List<ContactHint> rows = jdbcTemplate.query(
                    """
                    SELECT id, nom, fonction FROM partner_contacts
                    WHERE tenant_id = ? AND id = ?
                      AND (?::uuid IS NULL OR partner_id = ?)
                    LIMIT 1
                    """,
                    (rs, i) -> new ContactHint(
                            (UUID) rs.getObject("id"),
                            formatContactLabel(rs.getString("nom"), rs.getString("fonction"))),
                    tenantId(),
                    contactId,
                    partnerId,
                    partnerId);
            if (!rows.isEmpty()) {
                return rows.get(0);
            }
        }
        if (StringUtils.hasText(contactClient)) {
            return new ContactHint(null, contactClient.trim());
        }
        return ContactHint.empty();
    }

    private static String formatContactLabel(String nom, String fonction) {
        if (!StringUtils.hasText(nom)) {
            return null;
        }
        if (StringUtils.hasText(fonction)) {
            return nom.trim() + " - " + fonction.trim();
        }
        return nom.trim();
    }

    private record ContactHint(UUID id, String label) {
        static ContactHint empty() {
            return new ContactHint(null, null);
        }
    }

    private List<Devis> loadRows(UUID tenantId, String status, String clientId) {
        if (StringUtils.hasText(status) && StringUtils.hasText(clientId)) {
            return repository.findByTenantIdAndStatusOrderByDateEmissionDescCreatedAtDesc(
                            tenantId, status.trim())
                    .stream()
                    .filter(d -> clientId.trim().equals(d.getClientId()))
                    .sorted(defaultComparator())
                    .toList();
        }
        if (StringUtils.hasText(status)) {
            return repository.findByTenantIdAndStatusOrderByDateEmissionDescCreatedAtDesc(
                    tenantId, status.trim());
        }
        if (StringUtils.hasText(clientId)) {
            return repository.findByTenantIdAndClientIdOrderByDateEmissionDescCreatedAtDesc(
                    tenantId, clientId.trim());
        }
        return repository.findByTenantIdOrderByDateEmissionDescCreatedAtDesc(tenantId);
    }

    private Comparator<Devis> defaultComparator() {
        return Comparator.comparing(Devis::getDateEmission, Comparator.reverseOrder())
                .thenComparing(Devis::getCreatedAt, Comparator.reverseOrder());
    }

    private void applyLignes(Devis entity, List<DevisLigneInputDto> inputs, UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        Map<String, UUID> idByClientKey = new HashMap<>();
        int fallbackOrdre = 0;
        for (DevisLigneInputDto input : inputs) {
            fallbackOrdre += 1;
            UUID explicitId = parseUuidOrNull(input.getId());
            if (explicitId != null && input.getId() != null && !input.getId().isBlank()) {
                idByClientKey.put(input.getId().trim(), explicitId);
            }

            UUID parentId = resolveParentId(input.getParentLigneId(), idByClientKey);
            BigDecimal qty = input.getQuantite();
            BigDecimal pu = input.getPrixUnitaireHt();
            BigDecimal totalHt = input.getTotalHt();
            if (totalHt == null && qty != null && pu != null) {
                totalHt = qty.multiply(pu).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
            }

            DevisLigne.DevisLigneBuilder ligneBuilder = DevisLigne.builder()
                    .tenantId(tenantId)
                    .devis(entity)
                    .ordre(input.getOrdre() != null ? input.getOrdre() : fallbackOrdre)
                    .parentLigneId(parentId)
                    .type(normalizeLigneType(input.getType()))
                    .code(trimOrNull(input.getCode()))
                    .designation(input.getDesignation().trim())
                    .ouvrageId(parseUuidOrNull(input.getOuvrageId()))
                    .unite(trimOrNull(input.getUnite()))
                    .quantite(qty)
                    .prixUnitaireHt(pu)
                    .totalHt(totalHt)
                    .remisePercent(input.getRemisePercent())
                    .notes(trimOrNull(input.getNotes()));
            if (explicitId != null) {
                ligneBuilder.id(explicitId);
            }
            entity.getLignes().add(ligneBuilder.build());
        }
    }

    private UUID resolveParentId(String parentRef, Map<String, UUID> idByClientKey) {
        if (!StringUtils.hasText(parentRef)) {
            return null;
        }
        UUID mapped = idByClientKey.get(parentRef.trim());
        if (mapped != null) {
            return mapped;
        }
        return parseUuidOrNull(parentRef);
    }

    private void applyTotals(Devis entity) {
        BigDecimal totalHt = BigDecimal.ZERO;
        if (entity.getLignes() != null) {
            for (DevisLigne ligne : entity.getLignes()) {
                if (DevisLigne.TYPE_OUVRAGE.equals(ligne.getType()) && ligne.getTotalHt() != null) {
                    totalHt = totalHt.add(ligne.getTotalHt());
                }
            }
        }
        if (entity.getRemiseGlobalePercent() != null
                && entity.getRemiseGlobalePercent().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal factor = BigDecimal.ONE.subtract(
                    entity.getRemiseGlobalePercent().divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP));
            totalHt = totalHt.multiply(factor);
        }
        totalHt = totalHt.setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal tvaTaux = entity.getTvaTaux() != null ? entity.getTvaTaux() : new BigDecimal("20");
        BigDecimal totalTva = totalHt
                .multiply(tvaTaux)
                .divide(new BigDecimal("100"), MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal totalTtc = totalHt.add(totalTva).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        entity.setTotalHt(totalHt);
        entity.setTotalTva(totalTva);
        entity.setTotalTtc(totalTtc);
    }

    private void attachLigneDevisRefs(Devis entity) {
        if (entity.getLignes() == null) {
            return;
        }
        for (DevisLigne ligne : entity.getLignes()) {
            ligne.setDevis(entity);
        }
    }

    private boolean matchesSearch(Devis entity, String term) {
        return contains(entity.getNumero(), term)
                || contains(entity.getObjet(), term)
                || contains(entity.getClientName(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private Devis requireDevis(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Devis not found"));
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        String prefix = "DV-" + year + "-";
        long count = repository.countByTenantIdAndNumeroStartingWith(tenantId, prefix);
        return prefix + String.format(Locale.ROOT, "%04d", count + 1);
    }

    private String nextChantierStubId() {
        int year = Year.now().getValue();
        return "CH-" + year + "-" + String.format(Locale.ROOT, "%03d", Math.abs(UUID.randomUUID().hashCode()) % 900 + 100);
    }

    private String normalizeLigneType(String type) {
        if (!StringUtils.hasText(type)) {
            throw new IllegalArgumentException("Ligne type is required");
        }
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        if (!DevisLigne.TYPE_CHAPITRE.equals(normalized)
                && !DevisLigne.TYPE_OUVRAGE.equals(normalized)
                && !DevisLigne.TYPE_TEXTE.equals(normalized)) {
            throw new IllegalArgumentException("Invalid ligne type: " + type);
        }
        return normalized;
    }

    private UUID parseUuidOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return UUID.fromString(value.trim());
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
