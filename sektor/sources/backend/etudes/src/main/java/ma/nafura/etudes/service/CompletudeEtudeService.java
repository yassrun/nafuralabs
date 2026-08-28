package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.SyntheseCoutAffaireDto;
import ma.nafura.etudes.api.dto.completude.ActionControle;
import ma.nafura.etudes.api.dto.completude.CompletudeCompteursDto;
import ma.nafura.etudes.api.dto.completude.CompletudeEtude;
import ma.nafura.etudes.api.dto.completude.ControleEtude;
import ma.nafura.etudes.api.dto.completude.QualiteChiffrageDto;
import ma.nafura.etudes.api.dto.completude.SeveriteControle;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.domain.dpu.PrixDpu;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Moteur minimal de complétude consommé par synthèse, {@code GET /completude} et les gates
 * gain/conversion (SEKTOR-211 AC-1 à AC-4).
 */
@Service
public class CompletudeEtudeService {

    /** Part de coûts estimés &gt; 0 — avertissement commercial (SEKTOR-202 §2.3). */
    public static final String ETU_120 = "ETU-120";
    /** 100 % de coûts non établis avec postes — bloquant (SEKTOR-211 AC-3). */
    public static final String ETU_130 = "ETU-130";
    /** Composants LIBRE sans décision Catalogue — warning (SEKTOR-215 AC-10). */
    public static final String ETU_131 = "ETU-131";

    private static final int PHASE_CHIFFRAGE = 3;
    private static final int ETAPE_CHIFFRAGE = DossierEtude.ETAPE_CHIFFRAGE;

    private final DossierEtudeRepository dossierRepository;
    private final DpgfNoeudRepository noeudRepository;
    private final SyntheseCoutAffaireService syntheseCoutAffaireService;
    private final DebourseDuNoeudService debourseDuNoeudService;
    private final PrixDpuRepository prixDpuRepository;
    private final DecisionCatalogueService decisionCatalogueService;

    public CompletudeEtudeService(
            DossierEtudeRepository dossierRepository,
            DpgfNoeudRepository noeudRepository,
            SyntheseCoutAffaireService syntheseCoutAffaireService,
            DebourseDuNoeudService debourseDuNoeudService,
            PrixDpuRepository prixDpuRepository,
            DecisionCatalogueService decisionCatalogueService) {
        this.dossierRepository = dossierRepository;
        this.noeudRepository = noeudRepository;
        this.syntheseCoutAffaireService = syntheseCoutAffaireService;
        this.debourseDuNoeudService = debourseDuNoeudService;
        this.prixDpuRepository = prixDpuRepository;
        this.decisionCatalogueService = decisionCatalogueService;
    }

    @Transactional(readOnly = true)
    public CompletudeEtude evaluer(UUID dossierId) {
        UUID tenantId = TenantContext.getTenantId();
        DossierEtude dossier = dossierRepository
                .findByIdAndTenantId(dossierId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.introuvable"));
        return evaluer(dossier);
    }

    @Transactional(readOnly = true)
    public CompletudeEtude evaluer(DossierEtude dossier) {
        UUID tenantId = TenantContext.getTenantId();
        List<DpgfNoeud> noeuds = chargerNoeuds(dossier, tenantId);
        List<DpgfNoeud> articles = noeuds.stream()
                .filter(n -> DpgfNoeud.TYPE_ARTICLE.equals(n.getType()))
                .toList();

        SyntheseCoutAffaireDto cout = syntheseCoutAffaireService.compute(articles);
        BigDecimal debourse = debourseDuNoeudService.sommeDebourseArticles(noeuds);
        QualiteChiffrageDto qualite = qualiteChiffrage(articles, cout, tenantId);

        List<ControleEtude> controles = new ArrayList<>();
        evaluerCouts(articles, cout, debourse, controles);
        evaluerLibresSansDecision(dossier, controles);

        CompletudeCompteursDto compteurs = compter(controles);
        int phaseUi = phaseUiCourante(dossier);
        boolean lectureSeule = dossier.getStatus() == StatutDossierEtude.GAGNE
                || dossier.getStatus() == StatutDossierEtude.CONVERTIE;

        return CompletudeEtude.builder()
                .dossierId(dossier.getId())
                .phaseUi(phaseUi)
                .etapeBackend(dossier.getCurrentStep() != null ? dossier.getCurrentStep() : 1)
                .lectureSeule(lectureSeule)
                .compteurs(compteurs)
                .controles(List.copyOf(controles))
                .qualiteChiffrage(qualite)
                .build();
    }

    /** Compteur affiché = bloquants + warnings visibles (SEKTOR-211 AC-1). */
    public int anomaliesAffichees(CompletudeEtude completude) {
        return completude.getCompteurs().getBloquants() + completude.getCompteurs().getWarnings();
    }

    public List<ControleEtude> controlesBloquants(CompletudeEtude completude) {
        return completude.getControles().stream()
                .filter(c -> c.getSeverite() == SeveriteControle.BLOCKING)
                .toList();
    }

    public List<ControleEtude> controlesWarnings(CompletudeEtude completude) {
        return completude.getControles().stream()
                .filter(c -> c.getSeverite() == SeveriteControle.WARNING)
                .toList();
    }

    private void evaluerCouts(
            List<DpgfNoeud> articles,
            SyntheseCoutAffaireDto cout,
            BigDecimal debourse,
            List<ControleEtude> controles) {
        if (articles.isEmpty()) {
            return;
        }
        BigDecimal partNonEtablis = cout.getPartCoutsNonEtablisPercent();
        boolean debourseNul = debourse.compareTo(BigDecimal.ZERO) == 0;
        boolean centPourCentNonEtabli =
                partNonEtablis.compareTo(new BigDecimal("100")) >= 0
                        || (cout.getMontantTotalHt().compareTo(BigDecimal.ZERO) > 0
                                && partNonEtablis.compareTo(new BigDecimal("99.5")) >= 0);

        if (debourseNul || centPourCentNonEtabli) {
            controles.add(ControleEtude.builder()
                    .code(ETU_130)
                    .phase(PHASE_CHIFFRAGE)
                    .etapeBackend(ETAPE_CHIFFRAGE)
                    .severite(SeveriteControle.BLOCKING)
                    .messageKey("etudes.controle.130")
                    .faits(Map.of(
                            "postes", articles.size(),
                            "debourseEtabli", debourse,
                            "partEstimee", partNonEtablis))
                    .action(ActionControle.CHIFFRER_POSTE)
                    .build());
            return;
        }

        if (partNonEtablis.compareTo(BigDecimal.ZERO) > 0) {
            controles.add(ControleEtude.builder()
                    .code(ETU_120)
                    .phase(PHASE_CHIFFRAGE)
                    .etapeBackend(ETAPE_CHIFFRAGE)
                    .severite(SeveriteControle.WARNING)
                    .messageKey("etudes.controle.120")
                    .faits(Map.of("partEstimee", partNonEtablis, "postes", articles.size()))
                    .action(ActionControle.CHIFFRER_POSTE)
                    .build());
        }
    }

    private void evaluerLibresSansDecision(DossierEtude dossier, List<ControleEtude> controles) {
        long libres = decisionCatalogueService.compterLibresSansDecision(dossier);
        if (libres <= 0) {
            return;
        }
        controles.add(ControleEtude.builder()
                .code(ETU_131)
                .phase(PHASE_CHIFFRAGE)
                .etapeBackend(ETAPE_CHIFFRAGE)
                .severite(SeveriteControle.WARNING)
                .messageKey("etudes.controle.131")
                .faits(Map.of("libres", libres))
                .action(ActionControle.TRAITER_BLOCAGE)
                .build());
    }

    private QualiteChiffrageDto qualiteChiffrage(
            List<DpgfNoeud> articles, SyntheseCoutAffaireDto cout, UUID tenantId) {
        BigDecimal partEstimee = cout.getPartCoutsNonEtablisPercent();
        BigDecimal partEtablie = BigDecimal.valueOf(100).subtract(partEstimee);

        int composantsTotal = 0;
        int composantsControles = 0;
        List<UUID> decomposeIds = articles.stream()
                .filter(a -> "DECOMPOSE".equals(a.getOrigineCout()))
                .map(DpgfNoeud::getId)
                .toList();
        if (!decomposeIds.isEmpty()) {
            List<PrixDpu> dpus =
                    prixDpuRepository.findByTenantIdAndDpgfNoeudIdIn(tenantId, decomposeIds);
            for (PrixDpu dpu : dpus) {
                if (dpu.getComposants() == null) {
                    continue;
                }
                for (ComposantDpu composant : dpu.getComposants()) {
                    composantsTotal++;
                    if (!"LIBRE".equals(composant.getReferenceType())) {
                        composantsControles++;
                    }
                }
            }
        }

        String ratio = composantsTotal == 0
                ? "aucun composant"
                : composantsControles + " / " + composantsTotal;

        return QualiteChiffrageDto.builder()
                .partEtablie(partEtablie)
                .partEstimee(partEstimee)
                .composantsTotal(composantsTotal)
                .composantsControles(composantsControles)
                .ratioComposantsAffichage(ratio)
                .build();
    }

    private static CompletudeCompteursDto compter(List<ControleEtude> controles) {
        int bloquants = 0;
        int warnings = 0;
        int infos = 0;
        Map<Integer, int[]> parPhase = new LinkedHashMap<>();
        for (ControleEtude c : controles) {
            switch (c.getSeverite()) {
                case BLOCKING -> bloquants++;
                case WARNING -> warnings++;
                case INFO -> infos++;
            }
            int[] bucket = parPhase.computeIfAbsent(c.getPhase(), k -> new int[4]);
            switch (c.getSeverite()) {
                case BLOCKING -> bucket[0]++;
                case WARNING -> bucket[1]++;
                case INFO -> bucket[2]++;
            }
            bucket[3]++;
        }
        List<CompletudeCompteursDto.CompteursParPhaseDto> phases = new ArrayList<>();
        for (Map.Entry<Integer, int[]> e : parPhase.entrySet()) {
            phases.add(CompletudeCompteursDto.CompteursParPhaseDto.builder()
                    .phase(e.getKey())
                    .bloquants(e.getValue()[0])
                    .warnings(e.getValue()[1])
                    .infos(e.getValue()[2])
                    .total(e.getValue()[3])
                    .build());
        }
        return CompletudeCompteursDto.builder()
                .bloquants(bloquants)
                .warnings(warnings)
                .infos(infos)
                .total(bloquants + warnings + infos)
                .parPhase(phases)
                .build();
    }

    private static int phaseUiCourante(DossierEtude dossier) {
        return switch (dossier.getStatus()) {
            case BROUILLON -> 1;
            case EN_ETUDE -> {
                int step = dossier.getCurrentStep() != null ? dossier.getCurrentStep() : 1;
                if (step <= DossierEtude.ETAPE_BORDEREAU) {
                    yield 1;
                }
                if (step <= DossierEtude.ETAPE_DECOMPOSITION) {
                    yield 2;
                }
                yield 3;
            }
            case EN_VALIDATION, VALIDEE, DEVIS_GENERE, GAGNE, CONVERTIE -> 4;
            default -> 1;
        };
    }

    private List<DpgfNoeud> chargerNoeuds(DossierEtude dossier, UUID tenantId) {
        if (dossier.getDpgfId() == null) {
            return List.of();
        }
        return noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dossier.getDpgfId(), tenantId);
    }
}
