package ma.nafura.etudes.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import ma.nafura.etudes.api.request.DossierEtudeCreateDto;
import ma.nafura.etudes.api.request.DossierEtudeUpdateDto;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.StatutDossierEtude;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.service.gate.ContexteGate;
import ma.nafura.etudes.service.gate.EtapeGate;
import ma.nafura.etudes.service.gate.ResultatGate;
import ma.nafura.platform.framework.context.TenantContext;
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
    private final ParametresEtudeService parametres;
    private final Map<Integer, EtapeGate> gatesParEtape;

    public DossierEtudeService(
            DossierEtudeRepository repository,
            DpgfNoeudRepository noeudRepository,
            DossierDocumentRepository documentRepository,
            ParametresEtudeService parametres,
            List<EtapeGate> gates) {
        this.repository = repository;
        this.noeudRepository = noeudRepository;
        this.documentRepository = documentRepository;
        this.parametres = parametres;
        this.gatesParEtape = gates.stream()
                .collect(Collectors.toMap(EtapeGate::etape, Function.identity()));
    }

    // ── Lecture ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DossierEtude> list(StatutDossierEtude status) {
        UUID tenant = tenantId();
        return status == null
                ? repository.findByTenantIdOrderByCreatedAtDesc(tenant)
                : repository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenant, status);
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
        DossierEtude dossier = DossierEtude.builder()
                .tenantId(tenant)
                .numero(numero)
                .objet(dto.getObjet().trim())
                .clientId(trimOrNull(dto.getClientId()))
                .clientNom(trimOrNull(dto.getClientNom()))
                .cpsDocumentId(trimOrNull(dto.getCpsDocumentId()))
                .bordereauDocumentId(trimOrNull(dto.getBordereauDocumentId()))
                .appelOffreClientId(dto.getAppelOffreClientId())
                .origine(StringUtils.hasText(dto.getOrigine())
                        ? dto.getOrigine().trim().toUpperCase()
                        : DossierEtude.ORIGINE_ETUDE)
                // Valeurs de départ, pas des règles : l'expert métier pose une marge par
                // article, variable (Q14). L'utilisateur les surchargera librement.
                .fraisGenerauxPercentDefaut(parametres.fraisGenerauxPercentDefaut())
                .margePercentDefaut(parametres.margePercentDefaut())
                .tvaTauxDefaut(parametres.tvaTauxDefaut())
                .notes(trimOrNull(dto.getNotes()))
                .build();
        return repository.save(dossier);
    }

    @Transactional
    public DossierEtude update(UUID id, DossierEtudeUpdateDto dto) {
        DossierEtude dossier = requireModifiable(id);
        if (StringUtils.hasText(dto.getObjet())) {
            dossier.setObjet(dto.getObjet().trim());
        }
        if (dto.getClientId() != null) {
            dossier.setClientId(trimOrNull(dto.getClientId()));
        }
        if (dto.getClientNom() != null) {
            dossier.setClientNom(trimOrNull(dto.getClientNom()));
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
        return transitionner(dossier, StatutDossierEtude.EN_VALIDATION);
    }

    /**
     * Validation par le N+1.
     *
     * <p>Le contrôle « l'auteur ne valide pas sa propre étude » est ici et non dans le
     * contrôleur : c'était le défaut de {@code ConsultationService.validate()}, qui changeait
     * le statut sans aucune vérification, sous la même permission que le rédacteur.
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
        return transitionner(dossier, StatutDossierEtude.VALIDEE);
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
        dossier.setMotifRefus(motif.trim());
        return transitionner(dossier, StatutDossierEtude.EN_ETUDE);
    }

    @Transactional
    public DossierEtude annuler(UUID id) {
        return transitionner(requireDossier(id), StatutDossierEtude.ANNULE);
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
        long documents = documentRepository.countByTenantIdAndDossierEtudeId(tenantId(), dossier.getId());
        return new ContexteGate(chargerArticles(dossier), documents);
    }

    /** Articles à plat — aucune règle d'étape n'a besoin de la hiérarchie. */
    private List<DpgfNoeud> chargerArticles(DossierEtude dossier) {
        if (dossier.getDpgfId() == null) {
            return List.of();
        }
        return noeudRepository
                .findByDpgfIdAndTenantIdOrderByOrdreAsc(dossier.getDpgfId(), tenantId())
                .stream()
                .filter(n -> DpgfNoeud.TYPE_ARTICLE.equals(n.getType()))
                .toList();
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
