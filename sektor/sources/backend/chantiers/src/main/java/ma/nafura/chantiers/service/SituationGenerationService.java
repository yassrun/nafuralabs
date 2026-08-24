package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.chantiers.domain.attachement.AttachementChantier;
import ma.nafura.chantiers.domain.attachement.AttachementLigne;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.situation.SituationLigne;
import ma.nafura.chantiers.domain.situation.SituationTravaux;
import ma.nafura.chantiers.repository.AttachementChantierRepository;
import ma.nafura.chantiers.repository.AttachementLigneRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.chantiers.repository.SituationLigneRepository;
import ma.nafura.chantiers.repository.SituationTravauxRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Contrat {@code situation-et-retenues}, AC-1 à AC-7 (et AC-8 à AC-12 pour la cascade de
 * retenues, {@link #computeFinancialTotals}).
 *
 * <p>Une situation ne relit plus {@code AvancementPhysique} ni {@code ChantierLot.quantite}
 * (AC-1) : sa seule source est l'ensemble des attachements {@code SIGNE_MOE} (ou au-delà) du
 * chantier qu'aucune situation antérieure n'a encore consommés (AC-4). Chaque ligne pointe un
 * nœud — poste ou lot-feuille — exactement comme une ligne d'attachement (AC-2) ; code,
 * désignation, unité et prix vendu sont lus sur le nœud à la génération, jamais recopiés à la
 * main (AC-2). Une ligne interne n'apparaît jamais : conséquence directe du filtre déjà appliqué
 * en amont par l'attachement (AC-7, contrat voisin AC-13) — cette classe ne relit pas {@code
 * ChantierLot}/{@code PosteBudgetaire} pour recalculer une quantité, seulement pour résoudre les
 * attributs d'affichage d'un nœud déjà retenu.
 */
@Service
public class SituationGenerationService {

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final SituationTravauxRepository situationRepository;
    private final SituationLigneRepository ligneRepository;
    private final AttachementChantierRepository attachementRepository;
    private final AttachementLigneRepository attachementLigneRepository;
    private final ChantierLotRepository lotRepository;
    private final PosteBudgetaireRepository posteRepository;
    private final ChantierService chantierService;

    public SituationGenerationService(
            SituationTravauxRepository situationRepository,
            SituationLigneRepository ligneRepository,
            AttachementChantierRepository attachementRepository,
            AttachementLigneRepository attachementLigneRepository,
            ChantierLotRepository lotRepository,
            PosteBudgetaireRepository posteRepository,
            ChantierService chantierService) {
        this.situationRepository = situationRepository;
        this.ligneRepository = ligneRepository;
        this.attachementRepository = attachementRepository;
        this.attachementLigneRepository = attachementLigneRepository;
        this.lotRepository = lotRepository;
        this.posteRepository = posteRepository;
        this.chantierService = chantierService;
    }

    @Transactional
    public SituationTravaux generate(String chantierId, int numeroOrdre) {
        return generate(chantierId, numeroOrdre, BigDecimal.ZERO);
    }

    /**
     * @param penalitesRetardHt AC-8 — montant saisi, jamais dérivé d'un planning ; {@code null}
     *     ou négatif vaut zéro.
     */
    @Transactional
    public SituationTravaux generate(String chantierId, int numeroOrdre, BigDecimal penalitesRetardHt) {
        if (numeroOrdre < 1) {
            throw new IllegalArgumentException("numero must be >= 1");
        }

        Chantier chantier = chantierService.getById(chantierId);
        UUID tenantId = tenantId();

        situationRepository
                .findByTenantIdAndChantierIdAndNumeroOrdre(tenantId, chantierId, numeroOrdre)
                .ifPresent(existing -> {
                    throw new IllegalStateException(
                            "Situation numero " + numeroOrdre + " already exists for chantier " + chantierId);
                });

        // AC-1, AC-4 — seuls les attachements signés (ou au-delà) non encore consommés par une
        // situation antérieure de ce chantier alimentent la génération.
        List<AttachementChantier> attachements = attachementRepository
                .findByTenantIdAndChantierIdAndStatusInAndSituationIdIsNullOrderByDateDebutAsc(
                        tenantId, chantierId, AttachementChantier.STATUTS_FIGES);
        // AC-5 — pas d'attachement signé disponible : génération refusée, pas de situation vide.
        if (attachements.isEmpty()) {
            throw new IllegalStateException("chantiers.situation.aucun_attachement_signe: " + chantierId);
        }

        List<String> attachementIds = attachements.stream().map(AttachementChantier::getId).toList();
        List<AttachementLigne> attachementLignes =
                attachementLigneRepository.findByTenantIdAndAttachementIdInOrderByOrdreAsc(tenantId, attachementIds);

        // AC-3 — la quantité de la ligne est la somme des quantités d'attachement du nœud, sur
        // les attachements retenus ci-dessus. Pas d'autre source de quantité.
        Map<String, BigDecimal> quantitePeriodeParNoeud = new LinkedHashMap<>();
        for (AttachementLigne ligne : attachementLignes) {
            quantitePeriodeParNoeud.merge(ligne.getNoeudId(), ligne.getQuantitePeriode(), BigDecimal::add);
        }

        Map<String, BigDecimal> previousCumulByNoeud = loadPreviousQuantites(tenantId, chantierId, numeroOrdre);

        List<SituationLigne> lignes = new ArrayList<>();
        BigDecimal travauxPeriodeHt = BigDecimal.ZERO;
        int ordre = 1;
        for (Map.Entry<String, BigDecimal> entry : quantitePeriodeParNoeud.entrySet()) {
            String noeudId = entry.getKey();
            BigDecimal quantitePeriode = entry.getValue();
            NoeudInfo info = resolveNoeudInfo(tenantId, noeudId);
            BigDecimal prixUnitaire = info.prixUnitaireVendu() != null ? info.prixUnitaireVendu() : BigDecimal.ZERO;
            BigDecimal quantitePrecedente = previousCumulByNoeud.getOrDefault(noeudId, BigDecimal.ZERO);
            BigDecimal quantiteCumulee = quantitePrecedente.add(quantitePeriode);
            BigDecimal montantHt = quantitePeriode.multiply(prixUnitaire).setScale(2, RoundingMode.HALF_UP);
            travauxPeriodeHt = travauxPeriodeHt.add(montantHt);

            lignes.add(SituationLigne.builder()
                    .id(buildLigneId(chantierId, numeroOrdre, ordre))
                    .tenantId(tenantId)
                    .noeudId(noeudId)
                    .code(info.code())
                    .designation(info.designation())
                    .unite(info.unite())
                    .quantitePeriode(quantitePeriode)
                    .quantitePrecedente(quantitePrecedente)
                    .quantiteCumulee(quantiteCumulee)
                    .prixUnitaire(prixUnitaire)
                    .montantHt(montantHt)
                    .ordre(ordre++)
                    .build());
        }
        travauxPeriodeHt = travauxPeriodeHt.setScale(2, RoundingMode.HALF_UP);

        // AC-4 — la période de la situation est bornée par les attachements qu'elle consomme,
        // jamais saisie à la main.
        LocalDate periodStart =
                attachements.stream().map(AttachementChantier::getDateDebut).min(LocalDate::compareTo).orElseThrow();
        LocalDate periodEnd =
                attachements.stream().map(AttachementChantier::getDateFin).max(LocalDate::compareTo).orElseThrow();

        BigDecimal cumulPrecedentHt = loadPreviousCumulCourant(tenantId, chantierId, numeroOrdre);
        BigDecimal cumulCourantHt = cumulPrecedentHt.add(travauxPeriodeHt).setScale(2, RoundingMode.HALF_UP);

        BigDecimal retenueGarantiePercent = chantier.getTauxRg() != null ? chantier.getTauxRg() : new BigDecimal("7");
        BigDecimal retenueAvancePercent = resolveRetenueAvancePercent(chantier);
        // AC-8 — un montant négatif ou absent vaut zéro, jamais une erreur.
        BigDecimal penalites = penalitesRetardHt != null && penalitesRetardHt.compareTo(BigDecimal.ZERO) > 0
                ? penalitesRetardHt
                : BigDecimal.ZERO;
        FinancialTotals totals = computeFinancialTotals(
                travauxPeriodeHt,
                penalites,
                retenueGarantiePercent,
                retenueAvancePercent,
                chantier.getTauxTva(),
                chantier.getTauxRas());

        String situationId = buildSituationId(chantierId, numeroOrdre);
        SituationTravaux situation = SituationTravaux.builder()
                .id(situationId)
                .tenantId(tenantId)
                .chantierId(chantierId)
                .numero(buildNumero(chantier.getCode(), numeroOrdre))
                .numeroOrdre(numeroOrdre)
                .datePeriodeDebut(periodStart)
                .datePeriodeFin(periodEnd)
                .dateEmission(LocalDate.now())
                .cumulPrecedentHt(cumulPrecedentHt)
                .cumulCourantHt(cumulCourantHt)
                .travauxPeriodeHt(totals.travauxPeriodeHt())
                .penalitesRetardHt(totals.penalitesRetardHt())
                .retenueGarantiePercent(retenueGarantiePercent)
                .retenueGarantieMontant(totals.retenueGarantieMontant())
                .retenueAvancePercent(retenueAvancePercent)
                .retenueAvanceMontant(totals.retenueAvanceMontant())
                .netAPayerHt(totals.netAPayerHt())
                .tvaTaux(chantier.getTauxTva())
                .netAPayerTtc(totals.netAPayerTtc())
                .rasTaux(totals.rasTaux())
                .rasMontant(totals.rasMontant())
                .status(SituationTravaux.STATUS_BROUILLON)
                .build();

        situationRepository.save(situation);
        for (SituationLigne ligne : lignes) {
            ligne.setSituationId(situation.getId());
            ligneRepository.save(ligne);
        }

        // AC-4 — chaque attachement consommé ne l'est plus jamais par une situation suivante.
        for (AttachementChantier attachement : attachements) {
            attachement.setSituationId(situation.getId());
            attachementRepository.save(attachement);
        }

        return situation;
    }

    /** AC-2, AC-12 — code, désignation, unité et prix vendu sont lus sur le nœud, jamais retapés. */
    private NoeudInfo resolveNoeudInfo(UUID tenantId, String noeudId) {
        return posteRepository
                .findByIdAndTenantId(noeudId, tenantId)
                .map(p -> new NoeudInfo(p.getCode(), p.getDesignation(), p.getUnite(), p.getPrixUnitaireHt()))
                .or(() -> lotRepository
                        .findByIdAndTenantId(noeudId, tenantId)
                        .map(l -> new NoeudInfo(l.getCode(), l.getDesignation(), l.getUnite(), l.getPrixUnitaireHt())))
                .orElseGet(() -> new NoeudInfo(noeudId, noeudId, null, null));
    }

    private Map<String, BigDecimal> loadPreviousQuantites(UUID tenantId, String chantierId, int numeroOrdre) {
        if (numeroOrdre <= 1) {
            return Map.of();
        }
        return situationRepository
                .findByTenantIdAndChantierIdAndNumeroOrdre(tenantId, chantierId, numeroOrdre - 1)
                .map(previous -> {
                    Map<String, BigDecimal> quantities = new LinkedHashMap<>();
                    for (SituationLigne ligne :
                            ligneRepository.findByTenantIdAndSituationIdOrderByOrdreAsc(tenantId, previous.getId())) {
                        if (ligne.getNoeudId() != null) {
                            quantities.put(ligne.getNoeudId(), ligne.getQuantiteCumulee());
                        }
                    }
                    return quantities;
                })
                .orElse(Map.of());
    }

    private BigDecimal loadPreviousCumulCourant(UUID tenantId, String chantierId, int numeroOrdre) {
        if (numeroOrdre <= 1) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return situationRepository
                .findByTenantIdAndChantierIdAndNumeroOrdre(tenantId, chantierId, numeroOrdre - 1)
                .map(SituationTravaux::getCumulCourantHt)
                .orElse(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * AC-10 — cascade fixe : pénalités (montant saisi, retiré en premier) → RG et avance
     * (parallèles, sur l'assiette réduite des pénalités) → net HT → TVA → net TTC (ce que reçoit
     * {@link ma.nafura.chantiers.service.port.bc.SituationToFacturePort}, inchangé, AC-11) → RAS
     * (dérivée de {@code Chantier.tauxRas}, purement informative, AC-9).
     *
     * <p>{@code travauxPeriodeBrutHt} est la ligne 1 du tableau AC-10 ; {@code penalitesRetardHt}
     * est saisi par l'appelant (AC-8), zéro par défaut — cette méthode ne le dérive jamais.
     */
    static FinancialTotals computeFinancialTotals(
            BigDecimal travauxPeriodeBrutHt,
            BigDecimal penalitesRetardHt,
            BigDecimal retenueGarantiePercent,
            BigDecimal retenueAvancePercent,
            BigDecimal tvaTaux,
            BigDecimal rasTaux) {
        BigDecimal travauxPeriodeHt = travauxPeriodeBrutHt.setScale(2, RoundingMode.HALF_UP);
        BigDecimal penalites = (penalitesRetardHt != null ? penalitesRetardHt : BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
        // AC-10, ligne 3/4 — assiette RG et avance : travaux de la période moins pénalités.
        BigDecimal assietteRetenues = travauxPeriodeHt.subtract(penalites).setScale(2, RoundingMode.HALF_UP);
        BigDecimal retenueGarantieMontant = percentOf(assietteRetenues, retenueGarantiePercent);
        BigDecimal retenueAvanceMontant = retenueAvancePercent != null
                ? percentOf(assietteRetenues, retenueAvancePercent)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        // AC-10, ligne 5 — net à payer HT = travaux − pénalités − RG − avance.
        BigDecimal netAPayerHt = travauxPeriodeHt
                .subtract(penalites)
                .subtract(retenueGarantieMontant)
                .subtract(retenueAvanceMontant)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal effectiveTva = tvaTaux != null ? tvaTaux : new BigDecimal("20");
        // AC-10, ligne 7 — net à payer TTC : c'est ce montant, jamais réduit de la RAS (AC-11).
        BigDecimal netAPayerTtc = netAPayerHt
                .multiply(BigDecimal.ONE.add(effectiveTva.divide(ONE_HUNDRED, 6, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);
        // AC-9, AC-10 ligne 8 — RAS dérivée du net TTC, informative, jamais déduite de la ligne 7.
        BigDecimal rasMontant = rasTaux != null
                ? percentOf(netAPayerTtc, rasTaux)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        return new FinancialTotals(
                travauxPeriodeHt,
                penalites,
                retenueGarantieMontant,
                retenueAvanceMontant,
                netAPayerHt,
                netAPayerTtc,
                rasTaux,
                rasMontant);
    }

    private static BigDecimal percentOf(BigDecimal base, BigDecimal percent) {
        if (percent == null || percent.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return base.multiply(percent)
                .divide(ONE_HUNDRED, 6, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * AC-10, ligne 4 — le taux réel du chantier. Corrige le bug constaté à la lecture du contrat
     * (SEKTOR-157) : cette méthode renvoyait une constante {@code "5"} au lieu de {@code
     * chantier.getTauxAvance()} dès que celui-ci était positif.
     */
    private static BigDecimal resolveRetenueAvancePercent(Chantier chantier) {
        if (chantier.getTauxAvance() != null && chantier.getTauxAvance().compareTo(BigDecimal.ZERO) > 0) {
            return chantier.getTauxAvance();
        }
        return null;
    }

    static String buildNumero(String chantierCode, int numeroOrdre) {
        String suffix = chantierCode != null ? chantierCode.replace("CH-", "") : "000";
        return "SIT-" + suffix + "-" + String.format("%02d", numeroOrdre);
    }

    private static String buildSituationId(String chantierId, int numeroOrdre) {
        return chantierId + "-sit-" + String.format("%02d", numeroOrdre);
    }

    private static String buildLigneId(String chantierId, int numeroOrdre, int ordre) {
        return chantierId + "-sit-" + String.format("%02d", numeroOrdre) + "-lig-" + ordre;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private record NoeudInfo(String code, String designation, String unite, BigDecimal prixUnitaireVendu) {}

    record FinancialTotals(
            BigDecimal travauxPeriodeHt,
            BigDecimal penalitesRetardHt,
            BigDecimal retenueGarantieMontant,
            BigDecimal retenueAvanceMontant,
            BigDecimal netAPayerHt,
            BigDecimal netAPayerTtc,
            BigDecimal rasTaux,
            BigDecimal rasMontant) {}
}
