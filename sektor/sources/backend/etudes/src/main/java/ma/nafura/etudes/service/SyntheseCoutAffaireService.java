package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.SyntheseCoutAffaireDto;
import ma.nafura.etudes.domain.dpu.OrigineCout;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SyntheseCoutAffaireService {

    private static final int PCT_SCALE = 1;

    private final DossierEtudeRepository dossierRepository;
    private final DpgfNoeudRepository noeudRepository;

    public SyntheseCoutAffaireService(
            DossierEtudeRepository dossierRepository, DpgfNoeudRepository noeudRepository) {
        this.dossierRepository = dossierRepository;
        this.noeudRepository = noeudRepository;
    }

    @Transactional(readOnly = true)
    public SyntheseCoutAffaireDto forDossier(UUID dossierId) {
        UUID tenantId = TenantContext.getTenantId();
        var dossier = dossierRepository
                .findByIdAndTenantId(dossierId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("etudes.dossier.not_found"));
        if (dossier.getDpgfId() == null) {
            return empty();
        }
        List<DpgfNoeud> articles = noeudRepository
                .findByDpgfIdAndTenantIdOrderByOrdreAsc(dossier.getDpgfId(), tenantId)
                .stream()
                .filter(n -> DpgfNoeud.TYPE_ARTICLE.equals(n.getType()))
                .toList();
        return compute(articles);
    }

    public SyntheseCoutAffaireDto compute(List<DpgfNoeud> articles) {
        Map<String, BigDecimal> montants = new LinkedHashMap<>();
        montants.put(OrigineCout.DECOMPOSE.name(), BigDecimal.ZERO);
        montants.put(OrigineCout.FORFAIT.name(), BigDecimal.ZERO);
        montants.put(OrigineCout.ESTIME.name(), BigDecimal.ZERO);
        montants.put("DEDUIT", BigDecimal.ZERO);

        BigDecimal montantTotal = BigDecimal.ZERO;
        BigDecimal coutEtabli = BigDecimal.ZERO;
        BigDecimal montantEtabli = BigDecimal.ZERO;
        BigDecimal montantDeduit = BigDecimal.ZERO;

        for (DpgfNoeud a : articles) {
            BigDecimal ligne = montantLigne(a);
            if (ligne == null) {
                continue;
            }
            montantTotal = montantTotal.add(ligne);
            boolean deduit = Boolean.TRUE.equals(a.getCoutDeduit());
            String bucket = deduit ? "DEDUIT" : (a.getOrigineCout() != null ? a.getOrigineCout() : OrigineCout.ESTIME.name());
            if (!montants.containsKey(bucket)) {
                bucket = OrigineCout.ESTIME.name();
            }
            montants.put(bucket, montants.get(bucket).add(ligne));

            if (deduit) {
                montantDeduit = montantDeduit.add(ligne);
            } else {
                montantEtabli = montantEtabli.add(ligne);
                BigDecimal cout = a.getCoutUnitaire();
                BigDecimal q = a.getQuantite() != null ? a.getQuantite() : BigDecimal.ONE;
                if (cout != null) {
                    coutEtabli = coutEtabli.add(cout.multiply(q));
                }
            }
        }

        BigDecimal marge = montantEtabli.subtract(coutEtabli);
        BigDecimal margePct = BigDecimal.ZERO;
        if (montantEtabli.compareTo(BigDecimal.ZERO) > 0) {
            margePct = marge
                    .multiply(BigDecimal.valueOf(100))
                    .divide(montantEtabli, PCT_SCALE, RoundingMode.HALF_UP);
        }

        BigDecimal partNonEtablis = BigDecimal.ZERO;
        if (montantTotal.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal nonEtabli = montants.get(OrigineCout.ESTIME.name()).add(montants.get("DEDUIT"));
            partNonEtablis = nonEtabli
                    .multiply(BigDecimal.valueOf(100))
                    .divide(montantTotal, PCT_SCALE, RoundingMode.HALF_UP);
        }

        Map<String, BigDecimal> percents = new LinkedHashMap<>();
        for (Map.Entry<String, BigDecimal> e : montants.entrySet()) {
            if (montantTotal.compareTo(BigDecimal.ZERO) > 0) {
                percents.put(
                        e.getKey(),
                        e.getValue()
                                .multiply(BigDecimal.valueOf(100))
                                .divide(montantTotal, PCT_SCALE, RoundingMode.HALF_UP));
            } else {
                percents.put(e.getKey(), BigDecimal.ZERO);
            }
        }

        return SyntheseCoutAffaireDto.builder()
                .montantTotalHt(montantTotal)
                .coutTotalEtabli(coutEtabli)
                .margeSurCoutsEtablis(marge)
                .margePercentSurCoutsEtablis(margePct)
                .montantCoutsDeduits(montantDeduit)
                .partCoutsNonEtablisPercent(partNonEtablis)
                .repartitionMontantParOrigine(montants)
                .repartitionPercentParOrigine(percents)
                .build();
    }

    private static BigDecimal montantLigne(DpgfNoeud a) {
        if (a.getTotal() != null) {
            return a.getTotal();
        }
        if (a.getPrixUnitaire() == null) {
            return null;
        }
        BigDecimal q = a.getQuantite() != null ? a.getQuantite() : BigDecimal.ONE;
        return q.multiply(a.getPrixUnitaire());
    }

    private static SyntheseCoutAffaireDto empty() {
        Map<String, BigDecimal> zero = new LinkedHashMap<>();
        zero.put(OrigineCout.DECOMPOSE.name(), BigDecimal.ZERO);
        zero.put(OrigineCout.FORFAIT.name(), BigDecimal.ZERO);
        zero.put(OrigineCout.ESTIME.name(), BigDecimal.ZERO);
        zero.put("DEDUIT", BigDecimal.ZERO);
        return SyntheseCoutAffaireDto.builder()
                .montantTotalHt(BigDecimal.ZERO)
                .coutTotalEtabli(BigDecimal.ZERO)
                .margeSurCoutsEtablis(BigDecimal.ZERO)
                .margePercentSurCoutsEtablis(BigDecimal.ZERO)
                .montantCoutsDeduits(BigDecimal.ZERO)
                .partCoutsNonEtablisPercent(BigDecimal.ZERO)
                .repartitionMontantParOrigine(zero)
                .repartitionPercentParOrigine(new LinkedHashMap<>(zero))
                .build();
    }
}
