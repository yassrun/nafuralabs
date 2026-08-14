package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.achats.api.dto.AnalyticsBucketResponseDto;
import ma.nafura.achats.api.dto.AnalyticsBucketRowDto;
import ma.nafura.achats.domain.model.AppelOffreAchat;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.ContratFournisseur;
import ma.nafura.achats.domain.model.DemandeAchat;
import ma.nafura.achats.repository.AppelOffreAchatRepository;
import ma.nafura.achats.repository.BonCommandeAchatRepository;
import ma.nafura.achats.repository.ContratFournisseurRepository;
import ma.nafura.achats.repository.DemandeAchatRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AchatsAnalyticsBucketService {

    private final BonCommandeAchatRepository bcRepository;
    private final BonCommandeAchatSeedService bcSeedService;
    private final DemandeAchatRepository daRepository;
    private final DemandeAchatSeedService daSeedService;
    private final ContratFournisseurRepository contratRepository;
    private final ContratFournisseurSousTraitanceSeedService contratSeedService;
    private final AppelOffreAchatRepository aoRepository;
    private final AppelOffreAchatSeedService aoSeedService;

    public AchatsAnalyticsBucketService(
            BonCommandeAchatRepository bcRepository,
            BonCommandeAchatSeedService bcSeedService,
            DemandeAchatRepository daRepository,
            DemandeAchatSeedService daSeedService,
            ContratFournisseurRepository contratRepository,
            ContratFournisseurSousTraitanceSeedService contratSeedService,
            AppelOffreAchatRepository aoRepository,
            AppelOffreAchatSeedService aoSeedService) {
        this.bcRepository = bcRepository;
        this.bcSeedService = bcSeedService;
        this.daRepository = daRepository;
        this.daSeedService = daSeedService;
        this.contratRepository = contratRepository;
        this.contratSeedService = contratSeedService;
        this.aoRepository = aoRepository;
        this.aoSeedService = aoSeedService;
    }

    @Transactional(readOnly = true)
    public AnalyticsBucketResponseDto compute(
            String dimensionsParam, LocalDate from, LocalDate to, String metricsParam) {
        bcSeedService.seedIfEmpty();
        daSeedService.seedIfEmpty();
        contratSeedService.seedIfEmpty();
        aoSeedService.seedIfEmpty();

        LocalDate periodStart = from != null ? from : LocalDate.of(2026, 1, 1);
        LocalDate periodEnd = to != null ? to : LocalDate.of(2026, 12, 31);
        if (periodStart.isAfter(periodEnd)) {
            throw new IllegalArgumentException("from must be on or before to");
        }

        List<String> dimensions = parseDimensions(dimensionsParam);
        Set<String> metrics = parseMetrics(metricsParam);

        UUID tenantId = TenantContext.getTenantId();
        List<BonCommandeAchat> bons = bcRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        List<DemandeAchat> demandes = daRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        List<ContratFournisseur> contrats = contratRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        List<AppelOffreAchat> aos = aoRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);

        Map<String, BucketAgg> buckets = new LinkedHashMap<>();

        for (BonCommandeAchat bc : bons) {
            if (bc.getDateCreation() == null
                    || bc.getDateCreation().isBefore(periodStart)
                    || bc.getDateCreation().isAfter(periodEnd)) {
                continue;
            }
            if (BonCommandeAchat.STATUS_ANNULE.equals(bc.getStatus())) {
                continue;
            }
            List<String> keys = keysFor(dimensions, bc.getChantierId(), bc.getRubrique());
            BucketAgg agg = buckets.computeIfAbsent(keyKey(keys), k -> new BucketAgg(keys));
            agg.volumeHt = agg.volumeHt.add(bc.getTotalTtc() != null ? bc.getTotalTtc() : BigDecimal.ZERO);
            agg.nbBc++;
            if (isBcEnCours(bc.getStatus())) {
                agg.commandesEnCours++;
            }
            if (!BonCommandeAchat.STATUS_ANNULE.equals(bc.getStatus())) {
                agg.montantEngage = agg.montantEngage.add(bc.getTotalTtc() != null ? bc.getTotalTtc() : BigDecimal.ZERO);
            }
        }

        for (DemandeAchat da : demandes) {
            if (DemandeAchat.STATUS_SOUMISE.equals(da.getStatus())
                    || DemandeAchat.STATUS_APPROUVEE.equals(da.getStatus())) {
                List<String> keys = keysFor(dimensions, da.getChantierId(), null);
                buckets.computeIfAbsent(keyKey(keys), k -> new BucketAgg(keys)).daEnAttente++;
            }
        }

        for (ContratFournisseur c : contrats) {
            if (ContratFournisseur.STATUS_EN_COURS.equals(c.getStatus())) {
                List<String> keys = keysFor(dimensions, c.getChantierId(), null);
                buckets.computeIfAbsent(keyKey(keys), k -> new BucketAgg(keys)).contratsActifs++;
            }
        }

        for (AppelOffreAchat ao : aos) {
            if (AppelOffreAchat.STATUS_PUBLIEE.equals(ao.getStatus())
                    || AppelOffreAchat.STATUS_CLOTUREE.equals(ao.getStatus())) {
                List<String> keys = keysFor(dimensions, ao.getChantierId(), null);
                buckets.computeIfAbsent(keyKey(keys), k -> new BucketAgg(keys)).aoEnCours++;
            }
        }

        if (buckets.isEmpty()) {
            buckets.put(
                    keyKey(keysFor(dimensions, null, null)),
                    new BucketAgg(keysFor(dimensions, null, null)));
        }

        List<AnalyticsBucketRowDto> rows = new ArrayList<>();
        for (BucketAgg agg : buckets.values()) {
            Map<String, Number> metricValues = new LinkedHashMap<>();
            if (wantsMetric(metrics, "volumeHt")) {
                metricValues.put("volumeHt", scale2(agg.volumeHt).longValue());
            }
            if (wantsMetric(metrics, "nbBc")) {
                metricValues.put("nbBc", agg.nbBc);
            }
            if (wantsMetric(metrics, "montantEngage")) {
                metricValues.put("montantEngage", scale2(agg.montantEngage).longValue());
            }
            if (wantsMetric(metrics, "commandesEnCours")) {
                metricValues.put("commandesEnCours", agg.commandesEnCours);
            }
            if (wantsMetric(metrics, "daEnAttente")) {
                metricValues.put("daEnAttente", agg.daEnAttente);
            }
            if (wantsMetric(metrics, "contratsActifs")) {
                metricValues.put("contratsActifs", agg.contratsActifs);
            }
            if (wantsMetric(metrics, "aoEnCours")) {
                metricValues.put("aoEnCours", agg.aoEnCours);
            }
            rows.add(AnalyticsBucketRowDto.of(agg.keys, metricValues));
        }

        return AnalyticsBucketResponseDto.of(dimensions, rows);
    }

    static List<String> parseDimensions(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of("societe", "bu");
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(String::toLowerCase)
                .collect(Collectors.toList());
    }

    static Set<String> parseMetrics(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Set.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    static List<String> keysFor(List<String> dimensions, String chantierId, String rubrique) {
        List<String> keys = new ArrayList<>();
        for (String dim : dimensions) {
            keys.add(switch (dim) {
                case "societe" -> societeFor(chantierId);
                case "bu" -> buFor(chantierId, rubrique);
                case "rubrique" -> rubrique != null ? rubrique : "AUTRE";
                default -> "—";
            });
        }
        return keys;
    }

    static String societeFor(String chantierId) {
        if (!StringUtils.hasText(chantierId)) {
            return "SocA";
        }
        return switch (chantierId) {
            case "ch-001", "ch-003", "ch-005" -> "SocA";
            case "ch-002", "ch-004" -> "SocB";
            default -> "SocA";
        };
    }

    static String buFor(String chantierId, String rubrique) {
        if (StringUtils.hasText(rubrique)) {
            return "BU-" + rubrique.toUpperCase();
        }
        if (!StringUtils.hasText(chantierId)) {
            return "BU-GEN";
        }
        return switch (chantierId) {
            case "ch-001", "ch-003", "ch-005" -> "BU-BAT";
            case "ch-002", "ch-004" -> "BU-INFRA";
            default -> "BU-AUTRE";
        };
    }

    private static String keyKey(List<String> keys) {
        return String.join("|", keys);
    }

    private static boolean isBcEnCours(String status) {
        return List.of(
                        BonCommandeAchat.STATUS_VALIDE,
                        BonCommandeAchat.STATUS_ENVOYE,
                        BonCommandeAchat.STATUS_ACCUSE_RECEPTION,
                        BonCommandeAchat.STATUS_PARTIELLEMENT_LIVRE,
                        BonCommandeAchat.STATUS_LIVRE)
                .contains(status);
    }

    private static boolean wantsMetric(Set<String> metrics, String name) {
        return metrics.isEmpty() || metrics.contains(name.toLowerCase());
    }

    private static BigDecimal scale2(BigDecimal value) {
        return value.setScale(0, RoundingMode.HALF_UP);
    }

    private static final class BucketAgg {
        final List<String> keys;
        BigDecimal volumeHt = BigDecimal.ZERO;
        BigDecimal montantEngage = BigDecimal.ZERO;
        int nbBc;
        int commandesEnCours;
        int daEnAttente;
        int contratsActifs;
        int aoEnCours;

        BucketAgg(List<String> keys) {
            this.keys = keys;
        }
    }
}
