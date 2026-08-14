package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.dto.AnalyticsBucketResponseDto;
import ma.nafura.rh.api.dto.AnalyticsBucketRowDto;
import ma.nafura.rh.domain.model.Conge;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.domain.model.FichePaie;
import ma.nafura.rh.repository.CongeRepository;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.FichePaieRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RhAnalyticsBucketService {

    private final EmployeRepository employeRepository;
    private final EmployeSeedService employeSeedService;
    private final FichePaieRepository fichePaieRepository;
    private final FichePaieSeedService fichePaieSeedService;
    private final CongeRepository congeRepository;
    private final CongeSeedService congeSeedService;

    public RhAnalyticsBucketService(
            EmployeRepository employeRepository,
            EmployeSeedService employeSeedService,
            FichePaieRepository fichePaieRepository,
            FichePaieSeedService fichePaieSeedService,
            CongeRepository congeRepository,
            CongeSeedService congeSeedService) {
        this.employeRepository = employeRepository;
        this.employeSeedService = employeSeedService;
        this.fichePaieRepository = fichePaieRepository;
        this.fichePaieSeedService = fichePaieSeedService;
        this.congeRepository = congeRepository;
        this.congeSeedService = congeSeedService;
    }

    @Transactional(readOnly = true)
    public AnalyticsBucketResponseDto compute(
            String dimensionsParam, LocalDate from, LocalDate to, String metricsParam) {
        employeSeedService.seedIfEmpty();
        fichePaieSeedService.seedIfEmpty();
        congeSeedService.seedIfEmpty();

        List<String> dimensions = parseDimensions(dimensionsParam);
        Set<String> metrics = parseMetrics(metricsParam);
        UUID tenantId = TenantContext.getTenantId();

        List<Employe> employes = employeRepository.findByTenantIdOrderByNomAscPrenomAsc(tenantId);
        List<FichePaie> paie = fichePaieRepository.findByTenantIdOrderByMoisDescNumeroDesc(tenantId);
        List<Conge> conges = congeRepository.findByTenantIdOrderByDateDebutDescNumeroDesc(tenantId);

        Map<String, Agg> buckets = new LinkedHashMap<>();
        for (Employe e : employes) {
            if (!Employe.STATUT_ACTIF.equals(e.getStatut())) {
                continue;
            }
            List<String> keys = keysFor(dimensions, e.getCategorie());
            Agg agg = buckets.computeIfAbsent(String.join("|", keys), k -> new Agg(keys));
            agg.totalActifs++;
            agg.masseSalariale = agg.masseSalariale.add(
                    e.getSalaireBase() != null ? e.getSalaireBase() : BigDecimal.ZERO);
            if ("CDI".equals(e.getTypeContrat())) {
                agg.totalCdi++;
            }
        }

        for (Conge c : conges) {
            if (Conge.STATUS_DEMANDE.equals(c.getStatus())) {
                buckets.values().forEach(a -> a.congesEnAttente++);
            }
            if (Conge.STATUS_EN_COURS.equals(c.getStatus())) {
                buckets.values().forEach(a -> a.congesEnCours++);
            }
        }

        for (FichePaie p : paie) {
            if (FichePaie.STATUS_BROUILLON.equals(p.getStatus())) {
                buckets.values().forEach(a -> a.paieAValider++);
            }
        }

        if (buckets.isEmpty()) {
            buckets.put("SocA|BU-RH", new Agg(List.of("SocA", "BU-RH")));
        }

        List<AnalyticsBucketRowDto> rows = new ArrayList<>();
        for (Agg agg : buckets.values()) {
            Map<String, Number> m = new LinkedHashMap<>();
            if (metrics.isEmpty() || metrics.contains("totalactifs")) {
                m.put("totalActifs", agg.totalActifs);
            }
            if (metrics.isEmpty() || metrics.contains("masssalariale")) {
                m.put("masseSalariale", scale0(agg.masseSalariale).longValue());
            }
            if (metrics.isEmpty() || metrics.contains("congesenattente")) {
                m.put("congesEnAttente", agg.congesEnAttente);
            }
            if (metrics.isEmpty() || metrics.contains("paieavalider")) {
                m.put("paieAValider", agg.paieAValider);
            }
            if (metrics.isEmpty() || metrics.contains("totalcdi")) {
                m.put("totalCDI", agg.totalCdi);
            }
            if (metrics.isEmpty() || metrics.contains("tauxconge")) {
                int taux = agg.totalActifs > 0
                        ? Math.round(agg.congesEnCours * 100f / agg.totalActifs)
                        : 0;
                m.put("tauxConge", taux);
            }
            rows.add(AnalyticsBucketRowDto.builder().keys(agg.keys).metrics(m).build());
        }
        return AnalyticsBucketResponseDto.builder().dimensions(dimensions).rows(rows).build();
    }

    private static List<String> keysFor(List<String> dimensions, String categorie) {
        List<String> keys = new ArrayList<>();
        for (String dim : dimensions) {
            keys.add(switch (dim) {
                case "societe" -> "SocA";
                case "bu" -> "BU-RH";
                case "categorie" -> categorie != null ? categorie : "AUTRE";
                default -> "—";
            });
        }
        return keys;
    }

    private static List<String> parseDimensions(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of("societe", "bu");
        }
        return Arrays.stream(raw.split(",")).map(String::trim).map(String::toLowerCase).toList();
    }

    private static Set<String> parseMetrics(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Set.of();
        }
        return Arrays.stream(raw.split(",")).map(String::trim).map(String::toLowerCase).collect(Collectors.toSet());
    }

    private static BigDecimal scale0(BigDecimal v) {
        return v.setScale(0, RoundingMode.HALF_UP);
    }

    private static final class Agg {
        final List<String> keys;
        int totalActifs;
        int totalCdi;
        int congesEnAttente;
        int paieAValider;
        int congesEnCours;
        BigDecimal masseSalariale = BigDecimal.ZERO;

        Agg(List<String> keys) {
            this.keys = keys;
        }
    }
}
