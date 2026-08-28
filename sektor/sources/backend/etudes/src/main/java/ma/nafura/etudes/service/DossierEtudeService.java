package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import ma.nafura.etudes.api.dto.DossierConversionResultDto;
import ma.nafura.etudes.api.dto.DossierEtudeSyntheseDto;
import ma.nafura.etudes.api.request.AppelOffreClientCreateDto;
import ma.nafura.etudes.api.request.DossierConvertirDto;
import ma.nafura.etudes.api.request.DossierEtudeCreateDto;
import ma.nafura.etudes.api.request.DossierEtudeUpdateDto;
import ma.nafura.etudes.api.request.DossierGagneDto;
import ma.nafura.etudes.api.request.DossierPerduDto;
import ma.nafura.etudes.api.request.PlacementPosteOrphelinDto;
import ma.nafura.etudes.domain.audit.TransitionEtude;
import ma.nafura.etudes.domain.dossier.MotifPerte;
import ma.nafura.etudes.domain.appeloffre.AppelOffreClient;
import ma.nafura.etudes.domain.devis.Devis;
import ma.nafura.etudes.domain.dossier.DossierDocument;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.DossierPieceAttendue;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.AvisExecutionRepository;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DossierPieceAttendueRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.gate.ContexteGate;
import ma.nafura.etudes.service.gate.EtapeGate;
import ma.nafura.etudes.service.gate.ResultatGate;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort;
import ma.nafura.etudes.service.port.capability.EtudeApprovalPort;
import ma.nafura.etudes.service.port.bc.EtudeClientPort;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
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

    /** AC-3 — tolérance d'écart entre montant attribué et total devis : 0,01 MAD. */
    private static final BigDecimal SEUIL_ATTRIBUTION = new BigDecimal("0.01");

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
    private final ChargeEtudeService chargeEtudeService;
    private final DossierIntervenantService intervenantService;
    private final AvisExecutionRepository avisExecutionRepository;
    private final DebourseDuNoeudService debourseDuNoeudService;
    private final ChainageAvalPort chainageAvalPort;
    private final ConsultationEtudeService consultationEtudeService;
    private final TransitionEtudeService transitionEtudeService;
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
            ChargeEtudeService chargeEtudeService,
            DossierIntervenantService intervenantService,
            AvisExecutionRepository avisExecutionRepository,
            DebourseDuNoeudService debourseDuNoeudService,
            ChainageAvalPort chainageAvalPort,
            @Lazy ConsultationEtudeService consultationEtudeService,
            TransitionEtudeService transitionEtudeService,
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
        this.chargeEtudeService = chargeEtudeService;
        this.intervenantService = intervenantService;
        this.avisExecutionRepository = avisExecutionRepository;
        this.debourseDuNoeudService = debourseDuNoeudService;
        this.chainageAvalPort = chainageAvalPort;
        this.consultationEtudeService = consultationEtudeService;
        this.transitionEtudeService = transitionEtudeService;
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

        ResolvedMoa moa = resolveMoa(dto.getClientId(), dto.getClientNom());
        String chargeNom = chargeEtudeService.requireIngenieur(
                dto.getChargeEtudeUserId(), dto.getChargeEtudeNom());

        UUID aocId = dto.getAppelOffreClientId();
        if (aocId == null && dto.getDateLimiteDepot() != null) {
            aocId = creerAocLie(dto, moa.nom()).getId();
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
        dossier.setClientId(moa.clientId());
        dossier.setClientNom(moa.nom());
        dossier.setChargeEtudeUserId(dto.getChargeEtudeUserId().trim());
        dossier.setChargeEtudeNom(chargeNom);
        DossierEtude saved = repository.save(dossier);
        pieceAttendueService.seedMinimalSiAbsent(saved.getId());
        intervenantService.upsertChargeEtude(
                saved.getId(), saved.getChargeEtudeUserId(), saved.getChargeEtudeNom());
        return saved;
    }

    @Transactional
    public DossierEtude update(UUID id, DossierEtudeUpdateDto dto) {
        DossierEtude dossier = requireModifiable(id);
        if (StringUtils.hasText(dto.getObjet())) {
            dossier.setObjet(dto.getObjet().trim());
        }
        if (dto.getClientId() != null || dto.getClientNom() != null) {
            appliquerMoa(dossier, dto.getClientId(), dto.getClientNom());
        }
        if (dto.getChargeEtudeUserId() != null) {
            String chargeNom = chargeEtudeService.requireIngenieur(
                    dto.getChargeEtudeUserId(), dto.getChargeEtudeNom());
            dossier.setChargeEtudeUserId(dto.getChargeEtudeUserId().trim());
            dossier.setChargeEtudeNom(chargeNom);
            intervenantService.upsertChargeEtude(
                    dossier.getId(), dossier.getChargeEtudeUserId(), dossier.getChargeEtudeNom());
        }
        intervenantService.enregistrerReviseur(dossier.getId());
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
        if (dossier.getAppelOffreClientId() == null && dto.getDateLimiteDepot() != null) {
            DossierEtudeCreateDto aocSeed = new DossierEtudeCreateDto();
            aocSeed.setObjet(dossier.getObjet());
            aocSeed.setAoReference(dto.getAoReference());
            aocSeed.setAoType(dto.getAoType());
            aocSeed.setDateLimiteDepot(dto.getDateLimiteDepot());
            aocSeed.setDateOuverturePlis(dto.getDateOuverturePlis());
            aocSeed.setVille(dto.getVille());
            aocSeed.setDelaiExecutionJours(dto.getDelaiExecutionJours());
            aocSeed.setEstimationMoaHt(dto.getEstimationMoaHt());
            aocSeed.setCautionProvisoire(dto.getCautionProvisoire());
            aocSeed.setCautionDefinitive(dto.getCautionDefinitive());
            aocSeed.setCautionRetenueGarantie(dto.getCautionRetenueGarantie());
            String donneur = StringUtils.hasText(dossier.getClientNom())
                    ? dossier.getClientNom()
                    : "MOA à préciser";
            dossier.setAppelOffreClientId(creerAocLie(aocSeed, donneur).getId());
        } else if (dossier.getAppelOffreClientId() != null) {
            enrichirAocExistant(dossier, dto);
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
        int niveaux = parametres.niveauxApprobationPour(totalHt);
        dossier.setNiveauxApprobation(niveaux);
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
        // Aligner sur le workflow moteur seulement s'il est réellement branché.
        if (approvalPort.isAvailable() && snap.etapeCount() > 0) {
            dossier.setNiveauxApprobation(snap.etapeCount());
        }
        return transitionner(dossier, StatutDossierEtude.EN_VALIDATION);
    }

    /**
     * Validation interne : N+1 puis éventuellement N+2 selon {@link DossierEtude#getNiveauxApprobation()}.
     *
     * <p>N+1 avance {@code validationEtape} vers N2 sans changer le statut métier (si 2 niveaux).
     * Le dernier niveau passe à {@code VALIDEE} puis tente la génération du devis.
     */
    @Transactional
    public DossierEtude valider(UUID id, String approbateur) {
        DossierEtude dossier = requireDossier(id);
        if (dossier.getStatus() != StatutDossierEtude.EN_VALIDATION) {
            throw new IllegalStateException("etudes.dossier.validation_hors_etat");
        }
        assertPeutApprouver(dossier, approbateur);

        String etape = dossier.getValidationEtape() != null
                ? dossier.getValidationEtape()
                : DossierEtude.VALIDATION_N1;

        intervenantService.enregistrerApprobateur(dossier.getId(), approbateur, approbateur);

        int niveaux = dossier.getNiveauxApprobation() != null ? dossier.getNiveauxApprobation() : 2;
        boolean derniereEtape = !(DossierEtude.VALIDATION_N1.equals(etape) && niveaux > 1);
        synchroniserDecisionMoteur(dossier, approbateur, derniereEtape);

        if (!derniereEtape) {
            dossier.setValidationEtape(DossierEtude.VALIDATION_N2);
            dossier.setMotifRefus(null);
            return repository.save(dossier);
        }

        dossier.setValidationEtape(null);
        dossier.setNiveauxApprobation(null);
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
        dossier.setNiveauxApprobation(null);
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
        return genererDevis(id, null);
    }

    /**
     * {@code clientId} : Partner CLIENT déjà créé. Ignoré si le dossier en a déjà un.
     * Permet de lier après validation (PUT en-tête refusé — {@code VALIDEE} n'est pas modifiable).
     */
    @Transactional
    public DossierEtude genererDevis(UUID id, String clientId) {
        DossierEtude dossier = requireDossier(id);
        if (dossier.getStatus() == StatutDossierEtude.DEVIS_GENERE && dossier.getDevisGenereId() != null) {
            return dossier;
        }
        if (dossier.getStatus() != StatutDossierEtude.VALIDEE
                && dossier.getStatus() != StatutDossierEtude.DEVIS_GENERE) {
            throw new IllegalStateException("etudes.dossier.devis_hors_etat");
        }
        if (!StringUtils.hasText(dossier.getClientId()) && StringUtils.hasText(clientId)) {
            appliquerMoa(dossier, clientId.trim(), null);
            repository.save(dossier);
        }
        return exigenceGenerationDevis(dossier);
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
                .chargeEtudeUserId(dossier.getChargeEtudeUserId())
                .chargeEtudeNom(dossier.getChargeEtudeNom())
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
                .chantierGenereId(dossier.getChantierGenereId())
                .marcheGenereId(dossier.getMarcheGenereId())
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
        annulerDemandeResiduelle(dossier, "Étude annulée");
        return transitionner(dossier, StatutDossierEtude.ANNULE);
    }

    /** L13 — affaire gagnée (DEVIS_GENERE → GAGNE), AC-1 à AC-6 de continuite-etude-devis-chantier. */
    @Transactional
    public DossierEtude gagne(UUID id, DossierGagneDto body) {
        DossierEtude dossier = requireDossier(id);
        UUID devisIdCommande = body.getDevisId() != null ? body.getDevisId() : dossier.getDevisGenereId();
        String empreinteCommande = empreinteGain(devisIdCommande, body);
        if (dossier.getStatus() == StatutDossierEtude.GAGNE
                || dossier.getStatus() == StatutDossierEtude.CONVERTIE) {
            if (StringUtils.hasText(dossier.getGainCommandeEmpreinte())
                    && dossier.getGainCommandeEmpreinte().equals(empreinteCommande)) {
                return dossier;
            }
            throw new IllegalStateException("etudes.dossier.gain_rejeu_divergent");
        }
        if (dossier.getStatus() != StatutDossierEtude.DEVIS_GENERE) {
            throw new IllegalStateException("etudes.dossier.gagne_hors_etat");
        }

        // AC-2 — un seul devis fait foi : même tenant, même étude, statut non terminal.
        Devis devis = requireDevisPourGain(dossier, devisIdCommande);

        // AC-3 — l'attribution correspond au document vendu, à 0,01 MAD près.
        BigDecimal totalDevis = devis.getTotalHt() != null ? devis.getTotalHt() : BigDecimal.ZERO;
        BigDecimal montant = body.getMontantAttribue();
        if (montant == null) {
            throw new IllegalArgumentException("etudes.dossier.attribution_requise");
        }
        if (montant.subtract(totalDevis).abs().compareTo(SEUIL_ATTRIBUTION) > 0) {
            throw new AttributionMismatchException(totalDevis, montant);
        }

        // AC-4 — une marge négative est un acte explicite : refus aux rôles ordinaires.
        BigDecimal debourseInitial = debourseInitialDuDevis(devis);
        boolean margeNegative = montant.compareTo(debourseInitial) < 0;
        String motifDerogation = trimOrNull(body.getMotifDerogation());
        if (margeNegative) {
            if (!peutDerogerMargeNegative()) {
                throw new MargeNegativeRefuseeException(montant, debourseInitial);
            }
            if (!StringUtils.hasText(motifDerogation)) {
                throw new IllegalArgumentException("etudes.dossier.derogation_motif_requis");
            }
        }

        // AC-1 — commande atomique : approuver le devis ET gagner l'étude, même transaction.
        UUID correlationId = UUID.randomUUID();
        String ancienStatutDevis = devis.getStatus();
        if (!Devis.STATUS_APPROUVE.equals(devis.getStatus())) {
            devis.setStatus(Devis.STATUS_APPROUVE);
            devisRepository.save(devis);
        }

        dossier.setDateAttribution(body.getDateAttribution());
        dossier.setReferenceMarche(trimOrNull(body.getReferenceMarche()));
        dossier.setMontantAttribue(montant);
        // Le devis explicitement accepté devient immédiatement l'unique référence aval.
        dossier.setDevisGenereId(devis.getId());
        dossier.setGainCommandeEmpreinte(empreinteCommande);
        DossierEtude gagne = transitionner(dossier, StatutDossierEtude.GAGNE);

        // AC-6 — les deux transitions sont consignées après les deux écritures, avec la même
        // corrélation : une panne avant ici n'écrit aucune ligne de journal.
        BigDecimal marge = montant.subtract(debourseInitial);
        transitionEtudeService.consignerGain(
                TransitionEtude.ENTITE_DEVIS,
                devis.getId().toString(),
                ancienStatutDevis,
                Devis.STATUS_APPROUVE,
                correlationId,
                margeNegative ? motifDerogation : null,
                montant,
                debourseInitial,
                marge);
        transitionEtudeService.consignerGain(
                TransitionEtude.ENTITE_DOSSIER,
                dossier.getId().toString(),
                StatutDossierEtude.DEVIS_GENERE.name(),
                StatutDossierEtude.GAGNE.name(),
                correlationId,
                margeNegative ? motifDerogation : null,
                montant,
                debourseInitial,
                marge);
        return gagne;
    }

    private static String empreinteGain(UUID devisId, DossierGagneDto body) {
        String canonique = String.join(
                "|",
                valeurCanonique(devisId),
                valeurCanonique(body.getDateAttribution()),
                valeurCanonique(trimOrNull(body.getReferenceMarche())),
                valeurCanonique(body.getMontantAttribue()),
                valeurCanonique(trimOrNull(body.getMotifDerogation())));
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(canonique.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 indisponible", ex);
        }
    }

    private static String valeurCanonique(Object value) {
        if (value == null) {
            return "∅";
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.stripTrailingZeros().toPlainString();
        }
        return value.toString();
    }

    /** AC-2 — le devis faisant foi : présent, même tenant, même étude, non annulé/perdu/expiré. */
    private Devis requireDevisPourGain(DossierEtude dossier, UUID devisIdExplicite) {
        UUID devisId = devisIdExplicite != null ? devisIdExplicite : dossier.getDevisGenereId();
        if (devisId == null) {
            throw new IllegalArgumentException("etudes.dossier.gain_devis_requis");
        }
        Devis devis = devisRepository
                .findByIdAndTenantId(devisId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.gain_devis_introuvable"));
        if (!dossier.getId().equals(devis.getDossierEtudeId())) {
            throw new IllegalStateException("etudes.dossier.gain_devis_autre_etude");
        }
        if (Devis.STATUS_ANNULE.equals(devis.getStatus())
                || Devis.STATUS_PERDU.equals(devis.getStatus())
                || Devis.STATUS_EXPIRE.equals(devis.getStatus())) {
            throw new IllegalStateException("etudes.dossier.gain_devis_termine");
        }
        return devis;
    }

    /** AC-4 — déboursé initial : coût établi du devis, même source que la conversion (budget-et-marge). */
    private BigDecimal debourseInitialDuDevis(Devis devis) {
        if (devis.getDpgfId() == null) {
            return BigDecimal.ZERO;
        }
        List<DpgfNoeud> noeuds = noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(
                devis.getDpgfId(), tenantId());
        return debourseDuNoeudService.sommeDebourseArticles(noeuds);
    }

    /** AC-4 — seul owner ou dg peut confirmer une marge négative. */
    private static boolean peutDerogerMargeNegative() {
        if (UserContext.isOwnerOrSuperAdmin()) {
            return true;
        }
        String role = UserContext.getUserRole();
        return "BTP_DG".equals(role);
    }

    /**
     * AC-9 — la conversion lit le devis accepté du dossier (jamais un autre) : c'est la source
     * commerciale que le chantier conservera. Une étude gagnée sans devis lié ne peut pas
     * produire un chantier issu d'étude.
     */
    private Devis requireDevisPourConversion(DossierEtude dossier) {
        if (dossier.getDevisGenereId() == null) {
            throw new IllegalStateException("etudes.dossier.convertir_sans_devis");
        }
        return devisRepository
                .findByIdAndTenantId(dossier.getDevisGenereId(), tenantId())
                .orElseThrow(() -> new IllegalStateException("etudes.dossier.convertir_sans_devis"));
    }

    /**
     * AC-10 — avant toute création, la vente initiale du chantier doit être identique au montant
     * attribué, au total du devis accepté et à la somme de l'arbre vendu, au centime près.
     * Toute divergence empêche la conversion : pas de correction, pas de ventilation silencieuse.
     */
    private void assertSnapshotVenteCoherent(
            BigDecimal montant, BigDecimal totalDevis, BigDecimal totalArticles) {
        boolean coherent = montant.subtract(totalDevis).abs().compareTo(SEUIL_ATTRIBUTION) <= 0
                && montant.subtract(totalArticles).abs().compareTo(SEUIL_ATTRIBUTION) <= 0;
        if (!coherent) {
            throw new IllegalStateException(
                    "etudes.dossier.snapshot_vente_incoherent: montant="
                            + montant.toPlainString()
                            + ", devis="
                            + totalDevis.toPlainString()
                            + ", arbre="
                            + totalArticles.toPlainString());
        }
    }

    /** L13 — affaire perdue (DEVIS_GENERE → PERDU). */
    @Transactional
    public DossierEtude perdu(UUID id, DossierPerduDto body) {
        DossierEtude dossier = requireDossier(id);
        if (dossier.getStatus() != StatutDossierEtude.DEVIS_GENERE) {
            throw new IllegalStateException("etudes.dossier.perdu_hors_etat");
        }
        MotifPerte motif = MotifPerte.parse(body.getMotif());
        dossier.setMotifPerte(motif.name());
        dossier.setConcurrentRetenu(trimOrNull(body.getConcurrentRetenu()));
        dossier.setEcartPrixEstime(body.getEcartPrixEstime());
        return transitionner(dossier, StatutDossierEtude.PERDU);
    }

    /**
     * L13 — conversion de l'étude gagnée en chantier.
     *
     * <p>Trois garde-fous, dans cet ordre :
     *
     * <ol>
     *   <li><b>AC-9</b> — une étude déjà convertie <b>renvoie son chantier</b>. Un seul
     *       comportement : jamais un second chantier, jamais un refus. Le verrou pessimiste sur
     *       la ligne du dossier fait que deux appels concurrents se rangent derrière ce cas.
     *   <li><b>AC-7</b> — depuis tout autre statut que {@code GAGNE}, refus avec un message
     *       métier.
     *   <li><b>AC-12</b> — un poste ou un sous-lot du devis sans lot parent identifiable arrête
     *       la conversion <b>avant</b> toute création, et est nommé. Rien n'est rattaché par
     *       défaut.
     * </ol>
     *
     * <p><b>AC-10</b> — aucun marché n'est créé : le marché naît à la notification.
     */
    @Transactional
    public DossierConversionResultDto convertir(UUID id, DossierConvertirDto body) {
        DossierEtude dossier = repository
                .lockByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
        if (StringUtils.hasText(dossier.getChantierGenereId())) {
            cloreDemandeResiduelle(dossier, "Étude déjà convertie");
            return DossierConversionResultDto.builder()
                    .dossierId(dossier.getId())
                    .chantierId(dossier.getChantierGenereId())
                    .status(dossier.getStatus().name())
                    .build();
        }
        if (dossier.getStatus() != StatutDossierEtude.GAGNE) {
            throw new IllegalStateException("etudes.dossier.convertir_hors_etat");
        }
        if (!StringUtils.hasText(dossier.getClientId())) {
            throw new IllegalArgumentException("etudes.dossier.client_requis");
        }

        List<DpgfNoeud> noeuds = chargerNoeuds(dossier);
        List<ChainageAvalPort.LotProjection> lots =
                placerNoeudsOrphelins(projeterLots(noeuds), body.getPlacementsPostesOrphelins());

        BigDecimal totalArticles = totalHt(noeuds.stream()
                .filter(n -> DpgfNoeud.TYPE_ARTICLE.equals(n.getType()))
                .toList());
        // AC-10 — la vente initiale est le total du devis accepté : jamais un montant libre.
        Devis devis = requireDevisPourConversion(dossier);
        BigDecimal totalDevis = devis.getTotalHt() != null ? devis.getTotalHt() : BigDecimal.ZERO;
        BigDecimal montant = body.getMontantHt() != null
                ? body.getMontantHt()
                : (dossier.getMontantAttribue() != null
                        ? dossier.getMontantAttribue()
                        : totalArticles);
        // AC-10 — montantVenteInitialHt = montant attribué = total devis = somme des vendus.
        assertSnapshotVenteCoherent(montant, totalDevis, totalArticles);
        BigDecimal debourseInitial = debourseDuNoeudService.sommeDebourseArticles(noeuds);

        String label = resolveChantierLabel(body.getChantierLabel(), dossier.getObjet());
        String marcheRef = StringUtils.hasText(body.getMarcheReference())
                ? body.getMarcheReference().trim()
                : dossier.getReferenceMarche();

        ChainageAvalPort.ConversionResult result = chainageAvalPort.convert(
                new ChainageAvalPort.ConversionCommand(
                        dossier.getId(),
                        dossier.getClientId(),
                        dossier.getClientNom(),
                        dossier.getObjet(),
                        label,
                        trimOrNull(body.getChantierCode()),
                        trimOrNull(body.getChantierVille()),
                        body.getDateDemarrage() != null
                                ? body.getDateDemarrage()
                                : dossier.getDateAttribution(),
                        body.getDureeMois(),
                        marcheRef,
                        montant,
                        body.getTauxTva() != null ? body.getTauxTva() : parametres.tvaTauxDefaut(),
                        lots,
                        // ── AC-9 — snapshot commercial immuable transmis au chantier ──
                        devis.getId(),
                        devis.getNumero(),
                        devis.getVersion(),
                        dossier.getDateAttribution() != null
                                ? dossier.getDateAttribution()
                                : LocalDate.now(),
                        "DEVIS",
                        montant,
                        debourseInitial));

        dossier.setChantierGenereId(result.chantierId());
        // AC-10 — pas de marché à la conversion : rien à mémoriser côté contractuel.
        if (dossier.getDevisGenereId() != null) {
            devisRepository
                    .findByIdAndTenantId(dossier.getDevisGenereId(), tenantId())
                    .ifPresent(d -> {
                        d.setChantierGenereId(result.chantierId());
                        devisRepository.save(d);
                    });
        }
        DossierEtude converted = transitionner(dossier, StatutDossierEtude.CONVERTIE);
        cloreDemandeResiduelle(converted, "Étude convertie en chantier");
        return DossierConversionResultDto.builder()
                .dossierId(converted.getId())
                .chantierId(result.chantierId())
                .status(converted.getStatus().name())
                .build();
    }

    /**
     * AC-12 — un arbre bancal se répare devant l'humain, jamais en silence.
     *
     * <p>Un nœud du devis dont le parent n'est pas identifiable est <b>orphelin</b>. Tant qu'un
     * seul orphelin n'a pas reçu de décision, la conversion s'arrête ici — donc <b>avant</b> le
     * moindre appel au port, donc avant qu'aucun chantier, arbre ou budget n'existe — et les
     * orphelins sont nommés dans l'exception. Si l'humain abandonne, il ne rappelle simplement
     * pas : rien n'a été créé et l'étude reste {@code GAGNE}.
     *
     * <p><b>Tout nœud, pas seulement les postes</b> (amendement du 24/08 après QA). Un
     * {@code SOUS_LOT} dont le lot parent est introuvable relève du même traitement : le laisser
     * remonter à la racine changerait la hiérarchie sans que personne ne le voie. Un {@code LOT},
     * lui, n'a légitimement jamais de parent — il n'est jamais orphelin.
     *
     * <p>Placer, ce n'est pas deviner : chaque nœud est rattaché nommément, à un lot existant du
     * devis ou à un lot d'accueil que l'humain crée. Ce lot d'accueil ne vient pas du devis : il
     * naît sans origine, donc interne (AC-3).
     */
    private List<ChainageAvalPort.LotProjection> placerNoeudsOrphelins(
            List<ChainageAvalPort.LotProjection> lots, List<PlacementPosteOrphelinDto> placements) {

        Set<String> codesDeLot = new LinkedHashSet<>();
        List<LotDaccueilPossible> lotsExistants = new ArrayList<>();
        for (ChainageAvalPort.LotProjection n : lots) {
            if (DpgfNoeud.TYPE_LOT.equals(n.type()) || DpgfNoeud.TYPE_SOUS_LOT.equals(n.type())) {
                codesDeLot.add(n.code());
                lotsExistants.add(new LotDaccueilPossible(n.code(), n.designation()));
            }
        }

        Map<UUID, PlacementPosteOrphelinDto> parPoste = new LinkedHashMap<>();
        for (PlacementPosteOrphelinDto p : placements != null ? placements : List.<PlacementPosteOrphelinDto>of()) {
            if (p != null && p.getPosteId() != null) {
                parPoste.put(p.getPosteId(), p);
            }
        }

        List<PosteOrphelin> nonPlaces = new ArrayList<>();
        Map<String, ChainageAvalPort.LotProjection> lotsDAccueil = new LinkedHashMap<>();
        Map<UUID, String> parentChoisi = new LinkedHashMap<>();
        int ordreAccueil = lots.size();

        for (ChainageAvalPort.LotProjection article : lots) {
            // Un LOT n'a jamais de parent par construction (validateTypeParent) : il n'est pas
            // orphelin. Les ARTICLE et les SOUS_LOT, si — même règle pour les deux.
            if (!DpgfNoeud.TYPE_ARTICLE.equals(article.type())
                    && !DpgfNoeud.TYPE_SOUS_LOT.equals(article.type())) {
                continue;
            }
            if (StringUtils.hasText(article.parentCode()) && codesDeLot.contains(article.parentCode())) {
                continue;
            }
            PlacementPosteOrphelinDto choix = parPoste.get(article.dpgfNoeudId());
            if (choix == null) {
                nonPlaces.add(new PosteOrphelin(article.dpgfNoeudId(), article.code(), article.designation()));
                continue;
            }
            if (StringUtils.hasText(choix.getLotCode())) {
                String code = choix.getLotCode().trim();
                if (!codesDeLot.contains(code)) {
                    throw new IllegalArgumentException("etudes.dossier.placement_lot_inconnu: " + code);
                }
                parentChoisi.put(article.dpgfNoeudId(), code);
            } else if (StringUtils.hasText(choix.getNouveauLotCode())) {
                String code = choix.getNouveauLotCode().trim();
                if (codesDeLot.contains(code)) {
                    throw new IllegalArgumentException("etudes.dossier.placement_lot_deja_pris: " + code);
                }
                lotsDAccueil.computeIfAbsent(code, c -> new ChainageAvalPort.LotProjection(
                        null,
                        c,
                        StringUtils.hasText(choix.getNouveauLotDesignation())
                                ? choix.getNouveauLotDesignation().trim()
                                : c,
                        DpgfNoeud.TYPE_LOT,
                        null,
                        null,
                        null,
                        null,
                        null,
                        ordreAccueil,
                        // Un lot d'accueil ne vient pas du devis : rien à copier.
                        null));
                parentChoisi.put(article.dpgfNoeudId(), code);
            } else {
                throw new IllegalArgumentException(
                        "etudes.dossier.placement_incomplet: " + article.code());
            }
        }

        if (!nonPlaces.isEmpty()) {
            throw new PostesOrphelinsException(nonPlaces, lotsExistants);
        }
        if (parentChoisi.isEmpty()) {
            return lots;
        }

        List<ChainageAvalPort.LotProjection> out = new ArrayList<>(lotsDAccueil.values());
        for (ChainageAvalPort.LotProjection n : lots) {
            String parent = parentChoisi.get(n.dpgfNoeudId());
            out.add(parent == null
                    ? n
                    : new ChainageAvalPort.LotProjection(
                            n.dpgfNoeudId(),
                            n.code(),
                            n.designation(),
                            n.type(),
                            parent,
                            n.unite(),
                            n.quantite(),
                            n.prixUnitaireHt(),
                            n.montantHt(),
                            n.ordre(),
                            n.debourse()));
        }
        return out;
    }

    private List<ChainageAvalPort.LotProjection> projeterLots(List<DpgfNoeud> noeuds) {
        List<ChainageAvalPort.LotProjection> out = new ArrayList<>();
        Map<UUID, String> codeById = new HashMap<>();
        for (DpgfNoeud n : noeuds) {
            codeById.put(n.getId(), n.getCode());
        }
        int ordre = 0;
        for (DpgfNoeud n : noeuds) {
            String parentCode = n.getParentId() != null ? codeById.get(n.getParentId()) : null;
            out.add(new ChainageAvalPort.LotProjection(
                    n.getId(),
                    n.getCode(),
                    n.getLibelle(),
                    n.getType(),
                    parentCode,
                    n.getUnite(),
                    n.getQuantite(),
                    n.getPrixUnitaire(),
                    n.getTotal(),
                    ordre++,
                    // Le déboursé décomposé descend avec le nœud : il n'est plus ré-agrégé en
                    // un total par rubrique au niveau chantier (budget-et-marge AC-1, AC-8).
                    debourseDuNoeudService.debourseDuNoeud(n)));
        }
        return out;
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
        // Voie manuelle (init-bordereau-manuel) : un DPGF existe déjà — BDP/CPS deviennent optionnels.
        boolean hasDpgf = dossier.getDpgfId() != null;
        boolean hasBordereau =
                hasDpgf || pieces.stream().anyMatch(DossierDocument::contientBordereau);
        boolean hasCps = hasDpgf || pieces.stream().anyMatch(DossierDocument::contientCps);
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
        long avisOuverts = avisExecutionRepository.countByTenantIdAndDossierEtudeIdAndStatut(
                tenantId(), dossier.getId(), "OUVERT");
        long avisEcartes = avisExecutionRepository.countByTenantIdAndDossierEtudeIdAndStatut(
                tenantId(), dossier.getId(), "ECARTE");
        long devisRecus = consultationEtudeService.countDevisRecus(dossier.getId());
        return new ContexteGate(
                articles,
                noeuds,
                pieces.size(),
                hasBordereau,
                hasCps,
                piecesAttendues,
                hasClientId,
                clientValide,
                avisOuverts,
                avisEcartes,
                devisRecus,
                parametres.consultationObligatoire(),
                parametres.consultationMinimum());
    }

    private AppelOffreClient creerAocLie(DossierEtudeCreateDto dto, String donneurOrdre) {
        AppelOffreClientCreateDto aoc = new AppelOffreClientCreateDto();
        String ref = StringUtils.hasText(dto.getAoReference())
                ? dto.getAoReference().trim()
                : "AO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        aoc.setReference(ref);
        aoc.setObjet(dto.getObjet().trim());
        aoc.setDonneurOrdre(StringUtils.hasText(donneurOrdre) ? donneurOrdre.trim() : "MOA à préciser");
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

    private void enrichirAocExistant(DossierEtude dossier, DossierEtudeUpdateDto dto) {
        AppelOffreClient aoc = aocRepository
                .findByIdAndTenantId(dossier.getAppelOffreClientId(), tenantId())
                .orElse(null);
        if (aoc == null) {
            return;
        }
        boolean dirty = false;
        if (StringUtils.hasText(dto.getObjet())) {
            aoc.setObjet(dto.getObjet().trim());
            dirty = true;
        }
        if (StringUtils.hasText(dto.getAoReference())) {
            aoc.setReference(dto.getAoReference().trim());
            dirty = true;
        }
        if (StringUtils.hasText(dto.getAoType())) {
            aoc.setType(dto.getAoType().trim().toUpperCase(Locale.ROOT));
            dirty = true;
        }
        if (dto.getDateLimiteDepot() != null) {
            aoc.setDateLimiteDepot(dto.getDateLimiteDepot());
            dirty = true;
        }
        if (dto.getDateOuverturePlis() != null) {
            aoc.setDateOuverturePlis(dto.getDateOuverturePlis());
            dirty = true;
        }
        if (dto.getVille() != null) {
            aoc.setVille(trimOrNull(dto.getVille()));
            dirty = true;
        }
        if (dto.getDelaiExecutionJours() != null) {
            aoc.setDelaiExecutionJours(dto.getDelaiExecutionJours());
            dirty = true;
        }
        if (dto.getEstimationMoaHt() != null) {
            aoc.setEstimationMoaHt(dto.getEstimationMoaHt());
            dirty = true;
        }
        if (dto.getCautionProvisoire() != null) {
            aoc.setCautionProvisoire(dto.getCautionProvisoire());
            dirty = true;
        }
        if (dto.getCautionDefinitive() != null) {
            aoc.setCautionDefinitive(dto.getCautionDefinitive());
            dirty = true;
        }
        if (dto.getCautionRetenueGarantie() != null) {
            aoc.setCautionRetenueGarantie(dto.getCautionRetenueGarantie());
            dirty = true;
        }
        if (StringUtils.hasText(dossier.getClientNom())
                && !dossier.getClientNom().equals(aoc.getDonneurOrdre())) {
            aoc.setDonneurOrdre(dossier.getClientNom());
            dirty = true;
        }
        if (dirty) {
            aocRepository.save(aoc);
        }
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
     * Partner optionnel ; sinon MOA texte libre (CPS / saisie).
     *
     * <p>Le client Partner n'est exigé qu'à la conclusion (devis / marché).
     */
    private void appliquerMoa(DossierEtude dossier, String rawClientId, String rawNom) {
        ResolvedMoa moa = resolveMoa(rawClientId, rawNom);
        dossier.setClientId(moa.clientId());
        dossier.setClientNom(moa.nom());
    }

    private ResolvedMoa resolveMoa(String rawClientId, String rawNom) {
        if (StringUtils.hasText(rawClientId)) {
            EtudeClientPort.ClientSnapshot client = clientPort.requireClientRole(rawClientId);
            return new ResolvedMoa(client.id().toString(), client.raisonSociale());
        }
        if (StringUtils.hasText(rawNom)) {
            return new ResolvedMoa(null, rawNom.trim());
        }
        throw new IllegalArgumentException("etudes.moa.requis");
    }

    private record ResolvedMoa(String clientId, String nom) {}

    private List<DpgfNoeud> chargerNoeuds(DossierEtude dossier) {
        if (dossier.getDpgfId() == null) {
            return List.of();
        }
        return noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(
                dossier.getDpgfId(), tenantId());
    }

    /** Best-effort après validation interne : le dossier reste VALIDEE si le client n'est pas encore lié. */
    private DossierEtude tenterGenerationDevis(DossierEtude dossier) {
        if (dossier.getDevisGenereId() != null) {
            return exigenceGenerationDevis(dossier);
        }
        if (dossier.getDpgfId() == null || !StringUtils.hasText(dossier.getClientId())) {
            return dossier;
        }
        try {
            clientPort.requireClientRole(dossier.getClientId());
        } catch (RuntimeException ignored) {
            return dossier;
        }
        return exigenceGenerationDevis(dossier);
    }

    private DossierEtude exigenceGenerationDevis(DossierEtude dossier) {
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
            case DEVIS_GENERE -> "MARQUER_GAGNE";
            case GAGNE -> "CONVERTIR";
            case CONVERTIE ->
                    StringUtils.hasText(dossier.getChantierGenereId()) ? "VOIR_CHANTIER" : "CONSULTER";
            default -> "CONSULTER";
        };
    }

    /**
     * Owner / SuperAdmin peuvent trancher le dossier sans être N+1, mais la demande
     * moteur doit suivre : sinon l'inbox Approbations reste ouverte après VALIDEE / CONVERTIE.
     */
    private void synchroniserDecisionMoteur(DossierEtude dossier, String approbateur, boolean derniereEtape) {
        if (!StringUtils.hasText(dossier.getApprovalRequestId()) || !approvalPort.isAvailable()) {
            return;
        }
        if (derniereEtape) {
            approvalPort.cloreApprouvee(
                    dossier.getApprovalRequestId(), approbateur, approbateur, null);
        } else {
            approvalPort.approuverEtape(
                    dossier.getApprovalRequestId(), approbateur, approbateur, null);
        }
    }

    /** Filet : une étude déjà validée / convertie ne laisse aucune demande ouverte. */
    private void cloreDemandeResiduelle(DossierEtude dossier, String motif) {
        if (!approvalPort.isAvailable()) {
            return;
        }
        String requestId = dossier.getApprovalRequestId();
        if (!StringUtils.hasText(requestId)) {
            requestId = approvalPort
                    .trouverOuverte(dossier.getId())
                    .map(EtudeApprovalPort.ApprovalSnapshot::requestId)
                    .orElse(null);
        }
        if (!StringUtils.hasText(requestId)) {
            return;
        }
        approvalPort.cloreApprouvee(requestId, acteurCourant(), acteurCourant(), motif);
    }

    private void annulerDemandeResiduelle(DossierEtude dossier, String motif) {
        if (!approvalPort.isAvailable()) {
            return;
        }
        String requestId = dossier.getApprovalRequestId();
        if (!StringUtils.hasText(requestId)) {
            requestId = approvalPort
                    .trouverOuverte(dossier.getId())
                    .map(EtudeApprovalPort.ApprovalSnapshot::requestId)
                    .orElse(null);
        }
        if (!StringUtils.hasText(requestId)) {
            return;
        }
        approvalPort.annuler(requestId, acteurCourant(), acteurCourant(), motif);
        dossier.setApprovalRequestId(null);
    }

    private String acteurCourant() {
        String email = UserContext.getUserEmail();
        if (StringUtils.hasText(email)) {
            return email;
        }
        UUID userId = UserContext.getUserIdOrNull();
        return userId != null ? userId.toString() : "system";
    }

    private void assertPeutApprouver(DossierEtude dossier, String approbateur) {
        if (UserContext.isOwnerOrSuperAdmin()) {
            return;
        }
        if (!StringUtils.hasText(approbateur)) {
            return;
        }
        if (intervenantService.bloqueApprobation(dossier.getId(), approbateur)) {
            throw new IllegalStateException("etudes.dossier.intervenant_ne_peut_valider");
        }
        if (!parametres.auteurPeutValider() && approbateur.equals(dossier.getCreatedBy())) {
            throw new IllegalStateException("etudes.dossier.auteur_ne_peut_valider");
        }
        // chargeEtudeUserId même si l'intervenant n'a pas encore été persisté (legacy)
        if (approbateur.equals(dossier.getChargeEtudeUserId())) {
            throw new IllegalStateException("etudes.dossier.intervenant_ne_peut_valider");
        }
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

    /**
     * AC-D2 — le libellé est obligatoire quand l'humain l'envoie ; absent du body, on retombe sur
     * l'objet du dossier (scripts API / compat).
     */
    static String resolveChantierLabel(String chantierLabel, String objetDossier) {
        if (chantierLabel != null) {
            String trimmed = chantierLabel.trim();
            if (!StringUtils.hasText(trimmed)) {
                throw new IllegalArgumentException("etudes.dossier.libelle_chantier_requis");
            }
            return trimmed;
        }
        if (!StringUtils.hasText(objetDossier)) {
            throw new IllegalArgumentException("etudes.dossier.libelle_chantier_requis");
        }
        return objetDossier.trim();
    }

    private static String trimOrNull(String v) {
        return StringUtils.hasText(v) ? v.trim() : null;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    /** Portée par l'exception pour que le contrôleur renvoie la liste des articles fautifs. */
    /** AC-12 — un poste du devis sans lot parent, nommé pour que l'humain le place. */
    public record PosteOrphelin(UUID posteId, String code, String designation) {}

    /** AC-12 — un lot du devis, offert comme destination possible. L'humain peut aussi en créer un. */
    public record LotDaccueilPossible(String code, String designation) {}

    /**
     * AC-12 — la conversion s'est arrêtée <b>avant de rien créer</b> parce que des postes du
     * devis n'ont pas de lot d'accueil. L'exception les nomme : c'est ce que l'écran affiche.
     */
    public static class PostesOrphelinsException extends RuntimeException {
        private final transient List<PosteOrphelin> postes;
        private final transient List<LotDaccueilPossible> lotsDisponibles;

        public PostesOrphelinsException(
                List<PosteOrphelin> postes, List<LotDaccueilPossible> lotsDisponibles) {
            super("etudes.dossier.postes_orphelins");
            this.postes = List.copyOf(postes);
            this.lotsDisponibles = List.copyOf(lotsDisponibles);
        }

        public List<PosteOrphelin> getPostes() {
            return postes;
        }

        /** Les lots du devis. L'humain choisit l'un d'eux, ou crée le lot d'accueil. */
        public List<LotDaccueilPossible> getLotsDisponibles() {
            return lotsDisponibles;
        }
    }

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

    /**
     * AC-3 — le montant attribué diffère du total HT du devis accepté au-delà de 0,01 MAD.
     * Porte les deux montants pour que l'écran les affiche et demande de corriger la version
     * du devis ; rien n'est réécrit en silence.
     */
    public static class AttributionMismatchException extends RuntimeException {
        private final transient BigDecimal totalDevis;
        private final transient BigDecimal montantAttribue;

        public AttributionMismatchException(BigDecimal totalDevis, BigDecimal montantAttribue) {
            super("etudes.dossier.attribution_differente_du_devis");
            this.totalDevis = totalDevis;
            this.montantAttribue = montantAttribue;
        }

        public BigDecimal getTotalDevis() {
            return totalDevis;
        }

        public BigDecimal getMontantAttribue() {
            return montantAttribue;
        }
    }

    /**
     * AC-4 — la marge initiale est négative et l'acteur n'a pas le droit de déroger
     * (ni owner, ni dg). Porte les montants pour l'explication.
     */
    public static class MargeNegativeRefuseeException extends RuntimeException {
        private final transient BigDecimal montantAttribue;
        private final transient BigDecimal debourseInitial;

        public MargeNegativeRefuseeException(BigDecimal montantAttribue, BigDecimal debourseInitial) {
            super("etudes.dossier.marge_negative_refusee");
            this.montantAttribue = montantAttribue;
            this.debourseInitial = debourseInitial;
        }

        public BigDecimal getMontantAttribue() {
            return montantAttribue;
        }

        public BigDecimal getDebourseInitial() {
            return debourseInitial;
        }
    }
}
