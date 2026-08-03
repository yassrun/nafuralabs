package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import ma.nafura.etudes.api.dto.DossierEtudeSyntheseDto;
import ma.nafura.etudes.api.request.AppelOffreClientCreateDto;
import ma.nafura.etudes.api.request.DossierEtudeCreateDto;
import ma.nafura.etudes.api.request.DossierEtudeUpdateDto;
import ma.nafura.etudes.domain.model.AppelOffreClient;
import ma.nafura.etudes.domain.model.Devis;
import ma.nafura.etudes.domain.model.DossierDocument;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.DossierPieceAttendue;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.StatutDossierEtude;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DossierPieceAttendueRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.gate.ContexteGate;
import ma.nafura.etudes.service.gate.EtapeGate;
import ma.nafura.etudes.service.gate.ResultatGate;
import ma.nafura.etudes.service.port.EtudeApprovalPort;
import ma.nafura.etudes.service.port.EtudeClientPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Parcours d'une étude de prix : création, franchissement d'étapes, transitions d'état.
 *
 * <p>Ne contient <b>aucun calcul de prix</b> — c'est le rôle de {@link DpuCalculator}, dont la
 * formule est validée par l'expert métier et ne doit pas être touchée.
 */
@Service
public class DossierEtudeService {

    private final DossierEtudeRepository repository;
    private final DpgfNoeudRepository noeudRepository;
    private final DossierDocumentRepository documentRepository;
    private final DevisRepository devisRepository;
    private final ParametresEtudeService parametres;
    private final EtudeApprovalPort approvalPort;
    private final EtudeClientPort clientPort;
    private final DevisService devisService;
    private final AppelOffreClientService aocService;
    private final AppelOffreClientRepository aocRepository;
    private final DossierPieceAttendueService pieceAttendueService;
    private final DossierPieceAttendueRepository pieceAttendueRepository;
    private final Map<Integer, EtapeGate> gatesParEtape;

    public DossierEtudeService(
            DossierEtudeRepository repository,
            DpgfNoeudRepository noeudRepository,
            DossierDocumentRepository documentRepository,
            DevisRepository devisRepository,
            ParametresEtudeService parametres,
            EtudeApprovalPort approvalPort,
            EtudeClientPort clientPort,
            @Lazy DevisService devisService,
            @Lazy AppelOffreClientService aocService,
            AppelOffreClientRepository aocRepository,
            @Lazy DossierPieceAttendueService pieceAttendueService,
            DossierPieceAttendueRepository pieceAttendueRepository,
            List<EtapeGate> gates) {
        this.repository = repository;
        this.noeudRepository = noeudRepository;
        this.documentRepository = documentRepository;
        this.devisRepository = devisRepository;
        this.parametres = parametres;
        this.approvalPort = approvalPort;
        this.clientPort = clientPort;
        this.devisService = devisService;
        this.aocService = aocService;
        this.aocRepository = aocRepository;
        this.pieceAttendueService = pieceAttendueService;
        this.pieceAttendueRepository = pieceAttendueRepository;
        this.gatesParEtape = gates.stream()
                .collect(Collectors.toMap(EtapeGate::etape, Function.identity()));
    }

    // ── Lecture ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DossierEtude> list(StatutDossierEtude status) {
        UUID tenant = tenantId();
        List<DossierEtude> dossiers = status == null
                ? repository.findByTenantIdOrderByCreatedAtDesc(tenant)
                : repository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenant, status);
        enrichirAoListing(dossiers);
        return dossiers;
    }

    /** Bookmark legacy AOC → dossier lié. */
    @Transactional(readOnly = true)
    public DossierEtude findByAppelOffreClientId(UUID appelOffreClientId) {
        return repository
                .findByTenantIdAndAppelOffreClientId(tenantId(), appelOffreClientId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
    }

    /** En-tête seul — l'arbre se charge à part, il peut compter des milliers de nœuds. */
    @Transactional(readOnly = true)
    public DossierEtude getById(UUID id) {
        return requireDossier(id);
    }

    // ── Écriture ─────────────────────────────────────────────────────────────

    @Transactional
    public DossierEtude create(DossierEtudeCreateDto dto) {
        UUID tenant = tenantId();
        String numero = StringUtils.hasText(dto.getNumero())
                ? dto.getNumero().trim()
                : genererNumero(tenant);
        if (repository.existsByTenantIdAndNumero(tenant, numero)) {
            throw new IllegalArgumentException("etudes.dossier.numero_existe");
        }

        EtudeClientPort.ClientSnapshot client = clientPort.requireClientRole(dto.getClientId());

        UUID aocId = dto.getAppelOffreClientId();
        if (aocId == null && dto.getDateLimiteDepot() != null) {
            aocId = creerAocLie(dto, client).getId();
        }

        DossierEtude dossier = DossierEtude.builder()
                .tenantId(tenant)
                .numero(numero)
                .objet(dto.getObjet().trim())
                .cpsDocumentId(trimOrNull(dto.getCpsDocumentId()))
                .bordereauDocumentId(trimOrNull(dto.getBordereauDocumentId()))
                .appelOffreClientId(aocId)
                .origine(StringUtils.hasText(dto.getOrigine())
                        ? dto.getOrigine().trim().toUpperCase()
                        : DossierEtude.ORIGINE_ETUDE)
                .fraisGenerauxPercentDefaut(parametres.fraisGenerauxPercentDefaut())
                .margePercentDefaut(parametres.margePercentDefaut())
                .tvaTauxDefaut(parametres.tvaTauxDefaut())
                .notes(trimOrNull(dto.getNotes()))
                .build();
        dossier.setClientId(client.id().toString());
        dossier.setClientNom(client.raisonSociale());
        DossierEtude saved = repository.save(dossier);
        pieceAttendueService.seedMinimalSiAbsent(saved.getId());
        return saved;
    }

    @Transactional
    public DossierEtude update(UUID id, DossierEtudeUpdateDto dto) {
        DossierEtude dossier = requireModifiable(id);
        if (StringUtils.hasText(dto.getObjet())) {
            dossier.setObjet(dto.getObjet().trim());
        }
        if (dto.getClientId() != null) {
            appliquerClient(dossier, dto.getClientId());
        }
        if (dto.getCpsDocumentId() != null) {
            dossier.setCpsDocumentId(trimOrNull(dto.getCpsDocumentId()));
        }
        if (dto.getBordereauDocumentId() != null) {
            dossier.setBordereauDocumentId(trimOrNull(dto.getBordereauDocumentId()));
        }
        if (dto.getFraisGenerauxPercentDefaut() != null) {
            dossier.setFraisGenerauxPercentDefaut(dto.getFraisGenerauxPercentDefaut());
        }
        if (dto.getMargePercentDefaut() != null) {
            dossier.setMargePercentDefaut(dto.getMargePercentDefaut());
        }
        if (dto.getTvaTauxDefaut() != null) {
            dossier.setTvaTauxDefaut(dto.getTvaTauxDefaut());
        }
        if (dto.getMargeGlobalePercent() != null) {
            dossier.setMargeGlobalePercent(dto.getMargeGlobalePercent());
        }
        if (dto.getNotes() != null) {
            dossier.setNotes(trimOrNull(dto.getNotes()));
        }
        return repository.save(dossier);
    }

    @Transactional
    public void delete(UUID id) {
        DossierEtude dossier = requireDossier(id);
        if (!dossier.getStatus().estModifiable()) {
            throw new IllegalStateException("etudes.dossier.suppression_verrouillee");
        }
        repository.delete(dossier);
    }

    // ── Parcours ─────────────────────────────────────────────────────────────

    /**
     * État des cinq étapes, sans effet de bord.
     *
     * <p>Le front interroge cet endpoint au lieu de recalculer les règles de son côté :
     * c'est ce qui empêche la divergence front/back qu'avait {@code consultation}.
     */
    @Transactional(readOnly = true)
    public List<ResultatGate> evaluerGates(UUID id) {
        DossierEtude dossier = requireDossier(id);
        ContexteGate contexte = chargerContexte(dossier);
        return gatesParEtape.values().stream()
                .sorted(Comparator.comparingInt(EtapeGate::etape))
                .map(g -> g.evaluer(contexte))
                .toList();
    }

    @Transactional
    public DossierEtude allerAEtape(UUID id, int etape) {
        if (etape < DossierEtude.ETAPE_PREMIERE || etape > DossierEtude.ETAPE_CHIFFRAGE) {
            throw new IllegalArgumentException("etudes.dossier.etape_invalide");
        }
        DossierEtude dossier = requireModifiable(id);
        int courante = dossier.getCurrentStep() != null
                ? dossier.getCurrentStep()
                : DossierEtude.ETAPE_PREMIERE;

        // En avant seulement : on vérifie chaque étape franchie. En arrière : libre.
        if (etape > courante) {
            ContexteGate contexte = chargerContexte(dossier);
            for (int e = courante; e < etape; e++) {
                assertGateFranchie(e, contexte);
            }
            // Entrée en synthèse : tous les postes doivent être chiffrés (PU > 0, taux si DPU).
            if (etape == DossierEtude.ETAPE_CHIFFRAGE) {
                assertGateFranchie(DossierEtude.ETAPE_CHIFFRAGE, contexte);
            }
        }
        dossier.setCurrentStep(etape);
        if (dossier.getStatus() == StatutDossierEtude.BROUILLON
                && etape > DossierEtude.ETAPE_PREMIERE) {
            dossier.setStatus(StatutDossierEtude.EN_ETUDE);
        }
        return repository.save(dossier);
    }

    @Transactional
    public DossierEtude soumettre(UUID id) {
        DossierEtude dossier = requireModifiable(id);
        ContexteGate contexte = chargerContexte(dossier);
        for (int e = DossierEtude.ETAPE_PREMIERE; e <= DossierEtude.ETAPE_CHIFFRAGE; e++) {
            assertGateFranchie(e, contexte);
        }
        dossier.setMotifRefus(null);
        dossier.setValidationEtape(DossierEtude.VALIDATION_N1);
        dossier.setCurrentStep(DossierEtude.ETAPE_CHIFFRAGE);
        BigDecimal totalHt = totalHt(contexte.articles());
        EtudeApprovalPort.ApprovalSnapshot snap = approvalPort.soumettre(
                dossier.getId(),
                dossier.getNumero(),
                dossier.getObjet(),
                totalHt,
                dossier.getCreatedBy(),
                dossier.getCreatedBy());
        if (StringUtils.hasText(snap.requestId())) {
            dossier.setApprovalRequestId(snap.requestId());
        }
        return transitionner(dossier, StatutDossierEtude.EN_VALIDATION);
    }

    /**
     * Validation interne : N+1 puis N+2.
     *
     * <p>N+1 avance {@code validationEtape} vers N2 sans changer le statut métier.
     * N+2 passe à {@code VALIDEE} puis tente la génération du devis.
     */
    @Transactional
    public DossierEtude valider(UUID id, String approbateur) {
        DossierEtude dossier = requireDossier(id);
        if (dossier.getStatus() != StatutDossierEtude.EN_VALIDATION) {
            throw new IllegalStateException("etudes.dossier.validation_hors_etat");
        }
        if (!parametres.auteurPeutValider()
                && approbateur != null
                && approbateur.equals(dossier.getCreatedBy())) {
            throw new IllegalStateException("etudes.dossier.auteur_ne_peut_valider");
        }

        String etape = dossier.getValidationEtape() != null
                ? dossier.getValidationEtape()
                : DossierEtude.VALIDATION_N1;

        if (StringUtils.hasText(dossier.getApprovalRequestId()) && approvalPort.isAvailable()) {
            approvalPort.approuverEtape(dossier.getApprovalRequestId(), approbateur, approbateur, null);
        }

        if (DossierEtude.VALIDATION_N1.equals(etape)) {
            dossier.setValidationEtape(DossierEtude.VALIDATION_N2);
            dossier.setMotifRefus(null);
            return repository.save(dossier);
        }

        dossier.setValidationEtape(null);
        dossier.setMotifRefus(null);
        DossierEtude validee = transitionner(dossier, StatutDossierEtude.VALIDEE);
        return tenterGenerationDevis(validee);
    }

    @Transactional
    public DossierEtude refuser(UUID id, String motif) {
        if (!StringUtils.hasText(motif)) {
            throw new IllegalArgumentException("etudes.dossier.motif_refus_requis");
        }
        DossierEtude dossier = requireDossier(id);
        if (dossier.getStatus() != StatutDossierEtude.EN_VALIDATION) {
            throw new IllegalStateException("etudes.dossier.refus_hors_etat");
        }
        if (StringUtils.hasText(dossier.getApprovalRequestId()) && approvalPort.isAvailable()) {
            approvalPort.refuser(dossier.getApprovalRequestId(), null, null, motif.trim());
        }
        dossier.setMotifRefus(motif.trim());
        dossier.setValidationEtape(null);
        dossier.setApprovalRequestId(null);
        dossier.setCurrentStep(DossierEtude.ETAPE_CHIFFRAGE);
        return transitionner(dossier, StatutDossierEtude.EN_ETUDE);
    }

    /**
     * Réouvre la structure du bordereau (retour étape 2) après chiffrage démarré.
     * Incrémente la révision ; les prix restent en base mais sont à revoir métier.
     */
    @Transactional
    public DossierEtude reouvrirBordereau(UUID id) {
        DossierEtude dossier = requireModifiable(id);
        if (dossier.getCurrentStep() == null
                || dossier.getCurrentStep() <= DossierEtude.ETAPE_BORDEREAU) {
            throw new IllegalStateException("etudes.dossier.reouverture_inutile");
        }
        int rev = dossier.getBordereauRevision() != null ? dossier.getBordereauRevision() : 1;
        dossier.setBordereauRevision(rev + 1);
        dossier.setCurrentStep(DossierEtude.ETAPE_BORDEREAU);
        return repository.save(dossier);
    }

    /** Relance idempotente : VALIDEE → DEVIS_GENERE si le devis n'existe pas encore. */
    @Transactional
    public DossierEtude genererDevis(UUID id) {
        DossierEtude dossier = requireDossier(id);
        if (dossier.getStatus() == StatutDossierEtude.DEVIS_GENERE && dossier.getDevisGenereId() != null) {
            return dossier;
        }
        if (dossier.getStatus() != StatutDossierEtude.VALIDEE
                && dossier.getStatus() != StatutDossierEtude.DEVIS_GENERE) {
            throw new IllegalStateException("etudes.dossier.devis_hors_etat");
        }
        return tenterGenerationDevis(dossier);
    }

    @Transactional(readOnly = true)
    public DossierEtudeSyntheseDto synthese(UUID id) {
        DossierEtude dossier = requireDossier(id);
        List<ResultatGate> gates = evaluerGates(id);
        ContexteGate contexte = chargerContexte(dossier);
        int anomalies = (int) gates.stream()
                .filter(g -> g.bloquant() && !g.problemes().isEmpty())
                .mapToLong(g -> g.problemes().size())
                .sum();
        BigDecimal totalHt = totalHt(contexte.articles());
        String devisNumero = null;
        if (dossier.getDevisGenereId() != null) {
            devisNumero = devisRepository
                    .findByIdAndTenantId(dossier.getDevisGenereId(), tenantId())
                    .map(Devis::getNumero)
                    .orElse(null);
        }
        String prochainRole = null;
        String prochainNom = null;
        if (dossier.getStatus() == StatutDossierEtude.EN_VALIDATION) {
            EtudeApprovalPort.ApprovalSnapshot snap = approvalPort
                    .trouverOuverte(dossier.getId())
                    .orElse(null);
            if (snap != null) {
                prochainRole = snap.prochainApprobateurRole();
                prochainNom = snap.prochainApprobateurNom();
            } else if (DossierEtude.VALIDATION_N2.equals(dossier.getValidationEtape())) {
                prochainRole = "BTP_DG";
                prochainNom = "Direction générale";
            } else {
                prochainRole = "BTP_DIRECTEUR_TRAVAUX";
                prochainNom = "Directeur travaux";
            }
        }
        return DossierEtudeSyntheseDto.builder()
                .id(dossier.getId())
                .numero(dossier.getNumero())
                .objet(dossier.getObjet())
                .clientId(dossier.getClientId())
                .clientNom(dossier.getClientNom())
                .appelOffreClientId(dossier.getAppelOffreClientId())
                .status(dossier.getStatus())
                .currentStep(dossier.getCurrentStep() != null ? dossier.getCurrentStep() : 1)
                .phase(resoudrePhase(dossier))
                .validationEtape(dossier.getValidationEtape())
                .bordereauRevision(
                        dossier.getBordereauRevision() != null ? dossier.getBordereauRevision() : 1)
                .structureVerrouillee(dossier.isStructureVerrouillee())
                .modifiable(dossier.isModifiable())
                .nombreArticles(contexte.articles().size())
                .anomaliesBloquantes(anomalies)
                .totalHt(totalHt)
                .devisGenereId(dossier.getDevisGenereId())
                .devisNumero(devisNumero)
                .approvalRequestId(dossier.getApprovalRequestId())
                .prochainApprobateurRole(prochainRole)
                .prochainApprobateurNom(prochainNom)
                .motifRefus(dossier.getMotifRefus())
                .createdBy(dossier.getCreatedBy())
                .updatedBy(dossier.getUpdatedBy())
                .updatedAt(dossier.getUpdatedAt())
                .gates(gates)
                .actionPrincipale(actionPrincipale(dossier, anomalies))
                .build();
    }

    @Transactional
    public DossierEtude annuler(UUID id) {
        DossierEtude dossier = requireDossier(id);
        dossier.setValidationEtape(null);
        return transitionner(dossier, StatutDossierEtude.ANNULE);
    }

    // ── Interne ──────────────────────────────────────────────────────────────

    private DossierEtude transitionner(DossierEtude dossier, StatutDossierEtude cible) {
        if (!dossier.getStatus().peutTransitionnerVers(cible)) {
            throw new IllegalStateException("etudes.dossier.transition_interdite");
        }
        dossier.setStatus(cible);
        return repository.save(dossier);
    }

    private void assertGateFranchie(int etape, ContexteGate contexte) {
        EtapeGate gate = gatesParEtape.get(etape);
        if (gate == null) {
            return;
        }
        ResultatGate r = gate.evaluer(contexte);
        if (!r.autoriseLaSuite()) {
            throw new GateNonFranchieException(r);
        }
    }

    /**
     * Ce que les règles d'étape ont à examiner, chargé une seule fois par évaluation.
     *
     * <p>Les cinq gates sont évaluées ensemble : les charger séparément relirait le même
     * bordereau cinq fois.
     */
    private ContexteGate chargerContexte(DossierEtude dossier) {
        var pieces = documentRepository.findByTenantIdAndDossierEtudeIdOrderByOrdreAsc(
                tenantId(), dossier.getId());
        boolean hasBordereau = pieces.stream().anyMatch(DossierDocument::contientBordereau);
        boolean hasCps = pieces.stream().anyMatch(DossierDocument::contientCps);
        List<DossierPieceAttendue> piecesAttendues =
                pieceAttendueRepository.findByTenantIdAndDossierEtudeIdOrderByCreatedAtAsc(
                        tenantId(), dossier.getId());
        List<DpgfNoeud> noeuds = chargerNoeuds(dossier);
        List<DpgfNoeud> articles = noeuds.stream()
                .filter(n -> DpgfNoeud.TYPE_ARTICLE.equals(n.getType()))
                .toList();
        boolean hasClientId = StringUtils.hasText(dossier.getClientId());
        boolean clientValide = false;
        if (hasClientId) {
            try {
                clientValide = clientPort.resolve(dossier.getClientId()).isPresent();
            } catch (IllegalArgumentException ex) {
                clientValide = false;
            }
        }
        return new ContexteGate(
                articles,
                noeuds,
                pieces.size(),
                hasBordereau,
                hasCps,
                piecesAttendues,
                hasClientId,
                clientValide);
    }

    private AppelOffreClient creerAocLie(
            DossierEtudeCreateDto dto, EtudeClientPort.ClientSnapshot client) {
        AppelOffreClientCreateDto aoc = new AppelOffreClientCreateDto();
        String ref = StringUtils.hasText(dto.getAoReference())
                ? dto.getAoReference().trim()
                : "AO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        aoc.setReference(ref);
        aoc.setObjet(dto.getObjet().trim());
        aoc.setDonneurOrdre(client.raisonSociale());
        aoc.setType(StringUtils.hasText(dto.getAoType())
                ? dto.getAoType().trim().toUpperCase(Locale.ROOT)
                : AppelOffreClient.TYPE_PUBLIC);
        aoc.setDateLimiteDepot(dto.getDateLimiteDepot());
        aoc.setDateOuverturePlis(dto.getDateOuverturePlis());
        aoc.setVille(trimOrNull(dto.getVille()));
        aoc.setDelaiExecutionJours(dto.getDelaiExecutionJours());
        aoc.setEstimationMoaHt(dto.getEstimationMoaHt());
        aoc.setCautionProvisoire(dto.getCautionProvisoire());
        aoc.setCautionDefinitive(dto.getCautionDefinitive());
        aoc.setCautionRetenueGarantie(dto.getCautionRetenueGarantie());
        aoc.setStatus(AppelOffreClient.STATUS_A_ETUDIER);
        return aocService.create(aoc);
    }

    private void enrichirAoListing(List<DossierEtude> dossiers) {
        List<UUID> aocIds = dossiers.stream()
                .map(DossierEtude::getAppelOffreClientId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (aocIds.isEmpty()) {
            return;
        }
        Map<UUID, AppelOffreClient> byId = new HashMap<>();
        for (UUID id : aocIds) {
            aocRepository.findByIdAndTenantId(id, tenantId()).ifPresent(a -> byId.put(id, a));
        }
        for (DossierEtude d : dossiers) {
            if (d.getAppelOffreClientId() == null) {
                continue;
            }
            AppelOffreClient aoc = byId.get(d.getAppelOffreClientId());
            if (aoc == null) {
                continue;
            }
            d.setAoType(aoc.getType());
            d.setAoDateLimiteDepot(aoc.getDateLimiteDepot());
        }
    }

    /**
     * Normalise le client depuis le référentiel Partner.
     *
     * <p>Le nom libre envoyé par le front est ignoré : on persiste uniquement le snapshot
     * canonique (UUID + raison sociale). Le client est obligatoire — une valeur vide est refusée.
     */
    private void appliquerClient(DossierEtude dossier, String rawClientId) {
        EtudeClientPort.ClientSnapshot client = clientPort.requireClientRole(rawClientId);
        dossier.setClientId(client.id().toString());
        dossier.setClientNom(client.raisonSociale());
    }

    private List<DpgfNoeud> chargerNoeuds(DossierEtude dossier) {
        if (dossier.getDpgfId() == null) {
            return List.of();
        }
        return noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(
                dossier.getDpgfId(), tenantId());
    }

    private DossierEtude tenterGenerationDevis(DossierEtude dossier) {
        if (dossier.getDevisGenereId() != null) {
            if (dossier.getStatus() == StatutDossierEtude.VALIDEE
                    && dossier.getStatus().peutTransitionnerVers(StatutDossierEtude.DEVIS_GENERE)) {
                return transitionner(dossier, StatutDossierEtude.DEVIS_GENERE);
            }
            return dossier;
        }
        if (dossier.getDpgfId() == null) {
            throw new IllegalStateException("etudes.dossier.devis_sans_dpgf");
        }
        Devis devis = devisService.createFromDossier(dossier);
        dossier.setDevisGenereId(devis.getId());
        repository.save(dossier);
        if (dossier.getStatus() == StatutDossierEtude.VALIDEE) {
            return transitionner(dossier, StatutDossierEtude.DEVIS_GENERE);
        }
        return dossier;
    }

    private static BigDecimal totalHt(List<DpgfNoeud> articles) {
        return articles.stream()
                .map(DpgfNoeud::getTotal)
                .filter(t -> t != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static String resoudrePhase(DossierEtude dossier) {
        return switch (dossier.getStatus()) {
            case BROUILLON -> "BORDEREAU";
            case EN_ETUDE -> {
                int step = dossier.getCurrentStep() != null ? dossier.getCurrentStep() : 1;
                yield step <= DossierEtude.ETAPE_BORDEREAU ? "BORDEREAU" : "CHIFFRAGE";
            }
            case EN_VALIDATION ->
                    DossierEtude.VALIDATION_N2.equals(dossier.getValidationEtape())
                            ? "VALIDATION_N2"
                            : "VALIDATION_N1";
            case VALIDEE -> "VALIDEE";
            case DEVIS_GENERE -> "DEVIS";
            case GAGNE, CONVERTIE -> "TERMINE";
            case PERDU, ANNULE -> dossier.getStatus().name();
        };
    }

    private static String actionPrincipale(DossierEtude dossier, int anomalies) {
        return switch (dossier.getStatus()) {
            case BROUILLON, EN_ETUDE -> {
                int step = dossier.getCurrentStep() != null ? dossier.getCurrentStep() : 1;
                if (step <= DossierEtude.ETAPE_BORDEREAU) {
                    yield anomalies > 0 ? "CORRIGER_BORDEREAU" : "SOUMETTRE_STRUCTURE";
                }
                yield anomalies > 0 ? "CORRIGER_CHIFFRAGE" : "SOUMETTRE_CHIFFRAGE";
            }
            case EN_VALIDATION ->
                    DossierEtude.VALIDATION_N2.equals(dossier.getValidationEtape())
                            ? "VALIDER_N2"
                            : "VALIDER_N1";
            case VALIDEE -> "GENERER_DEVIS";
            case DEVIS_GENERE -> "VOIR_DEVIS";
            default -> "CONSULTER";
        };
    }

    private DossierEtude requireDossier(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
    }

    private DossierEtude requireModifiable(UUID id) {
        DossierEtude dossier = requireDossier(id);
        if (!dossier.getStatus().estModifiable()) {
            throw new IllegalStateException("etudes.dossier.verrouille");
        }
        return dossier;
    }

    /**
     * Numéro séquentiel par tenant.
     *
     * <p>La contrainte d'unicité en base fait foi : en concurrence, l'insertion échoue et
     * l'appelant retente. {@code consultation} n'avait pas cette contrainte et pouvait
     * produire des doublons silencieux.
     */
    private String genererNumero(UUID tenantId) {
        return String.format("DE-%04d", repository.countByTenantId(tenantId) + 1);
    }

    private static String trimOrNull(String v) {
        return StringUtils.hasText(v) ? v.trim() : null;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    /** Portée par l'exception pour que le contrôleur renvoie la liste des articles fautifs. */
    public static class GateNonFranchieException extends RuntimeException {
        private final transient ResultatGate resultat;

        public GateNonFranchieException(ResultatGate resultat) {
            super("etudes.gate.non_franchie");
            this.resultat = resultat;
        }

        public ResultatGate getResultat() {
            return resultat;
        }
    }
}
