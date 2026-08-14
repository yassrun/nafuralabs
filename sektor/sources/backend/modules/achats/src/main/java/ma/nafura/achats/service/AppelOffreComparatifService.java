package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.api.dto.AppelOffreComparatifDto;
import ma.nafura.achats.api.dto.ScoreDetailDto;
import ma.nafura.achats.api.dto.ScoringAODto;
import ma.nafura.achats.api.dto.ScoringOffreLigneDto;
import ma.nafura.achats.domain.model.AppelOffreAchat;
import ma.nafura.achats.domain.model.OffreFournisseur;
import ma.nafura.achats.domain.model.OffreFournisseurLigne;
import ma.nafura.achats.repository.AppelOffreAchatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AppelOffreComparatifService {

    private static final int DELAI_REF_JOURS = 21;
    private static final int DEFAULT_NOTATION = 3;
    private static final BigDecimal HISTORIQUE_DIVISOR = new BigDecimal("500000");

    private final AppelOffreAchatService appelOffreAchatService;
    private final AppelOffreAchatRepository repository;

    public AppelOffreComparatifService(
            AppelOffreAchatService appelOffreAchatService, AppelOffreAchatRepository repository) {
        this.appelOffreAchatService = appelOffreAchatService;
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public AppelOffreComparatifDto getComparatif(UUID aoId) {
        AppelOffreAchat ao = appelOffreAchatService.getById(aoId);
        return buildComparatif(ao, Map.of());
    }

    @Transactional
    public AppelOffreComparatifDto recomputeAndPersist(UUID aoId) {
        AppelOffreAchat ao = appelOffreAchatService.getById(aoId);
        AppelOffreComparatifDto comparatif = buildComparatif(ao, Map.of());
        if (ao.getReponses() != null) {
            for (ScoringAODto scoring : comparatif.getScores()) {
                ao.getReponses().stream()
                        .filter(r -> r.getId() != null && r.getId().equals(scoring.getReponseId()))
                        .findFirst()
                        .ifPresent(offre -> offre.setScore(scoring.getScoreFinal()));
            }
            repository.save(ao);
        }
        return comparatif;
    }

    AppelOffreComparatifDto buildComparatif(AppelOffreAchat ao, Map<String, Integer> fournisseurNotationById) {
        List<OffreFournisseur> reponses = ao.getReponses() != null ? ao.getReponses() : List.of();
        if (reponses.isEmpty()) {
            return AppelOffreComparatifDto.builder()
                    .aoId(ao.getId())
                    .scores(List.of())
                    .build();
        }

        List<BigDecimal> totals = reponses.stream().map(this::totalHt).toList();
        BigDecimal minTotal = totals.stream().min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
        BigDecimal maxTotal = totals.stream().max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);

        List<Integer> delais = reponses.stream().map(this::delaiJours).toList();
        int minDelai = delais.stream().min(Integer::compareTo).orElse(0);
        int maxDelai = delais.stream().max(Integer::compareTo).orElse(0);

        List<ScoringAODto> scores = new ArrayList<>();
        for (OffreFournisseur rep : reponses) {
            BigDecimal prix = scorePrix(rep, minTotal, maxTotal);
            BigDecimal delai = scoreDelai(rep, minDelai, maxDelai);
            int notation = resolveNotation(rep.getFournisseurId(), fournisseurNotationById);
            BigDecimal qualite = scoreQualite(notation);
            BigDecimal historique = scoreHistorique(rep);
            BigDecimal art187 = scoreArt187(ao, rep);

            BigDecimal scoreFinal = capSum(
                    cap(prix, bd(50)),
                    cap(delai, bd(15)),
                    cap(qualite, bd(15)),
                    cap(historique, bd(10)),
                    cap(art187, bd(10)));

            Recommendation recommendation = recommend(scoreFinal, rep, ao);

            scores.add(ScoringAODto.builder()
                    .aoId(ao.getId())
                    .fournisseurId(rep.getFournisseurId())
                    .fournisseurName(rep.getFournisseurName())
                    .reponseId(rep.getId())
                    .offre(mapOffreLignes(rep))
                    .scoreFinal(scoreFinal)
                    .scoreDetail(ScoreDetailDto.builder()
                            .prix(cap(prix, bd(50)))
                            .delai(cap(delai, bd(15)))
                            .qualite(cap(qualite, bd(15)))
                            .historique(cap(historique, bd(10)))
                            .art187(cap(art187, bd(10)))
                            .build())
                    .recommandation(recommendation.label())
                    .raisonRecommandation(recommendation.raison())
                    .build());
        }

        applyTopRecommendation(scores);

        scores.sort(Comparator.comparing(ScoringAODto::getScoreFinal, Comparator.nullsFirst(Comparator.naturalOrder()))
                .reversed());

        return AppelOffreComparatifDto.builder().aoId(ao.getId()).scores(scores).build();
    }

    private void applyTopRecommendation(List<ScoringAODto> scores) {
        List<ScoringAODto> eligible =
                scores.stream().filter(s -> !"A_EXCLURE".equals(s.getRecommandation())).toList();
        if (eligible.isEmpty()) {
            return;
        }
        BigDecimal bestScore = eligible.stream()
                .map(ScoringAODto::getScoreFinal)
                .max(Comparator.naturalOrder())
                .orElse(BigDecimal.ZERO);
        if (bestScore.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        for (ScoringAODto scoring : scores) {
            if (!"A_EXCLURE".equals(scoring.getRecommandation())
                    && scoring.getScoreFinal() != null
                    && scoring.getScoreFinal().compareTo(bestScore) == 0) {
                scoring.setRecommandation("TOP");
                scoring.setRaisonRecommandation("Meilleur score global sur critères prix / délai / qualité.");
            }
        }
    }

    private BigDecimal scorePrix(OffreFournisseur rep, BigDecimal minTotal, BigDecimal maxTotal) {
        if (maxTotal.compareTo(minTotal) == 0) {
            return bd(50);
        }
        BigDecimal total = totalHt(rep);
        BigDecimal range = maxTotal.subtract(minTotal);
        if (range.compareTo(BigDecimal.ZERO) == 0) {
            return bd(50);
        }
        BigDecimal ratio = total.subtract(minTotal).divide(range, 8, RoundingMode.HALF_UP);
        return round2(bd(50).multiply(BigDecimal.ONE.subtract(ratio)));
    }

    private BigDecimal scoreDelai(OffreFournisseur rep, int minDelai, int maxDelai) {
        if (maxDelai == minDelai) {
            return bd(15);
        }
        int delai = delaiJours(rep);
        int range = maxDelai - minDelai;
        if (range == 0) {
            return bd(15);
        }
        double ratio = (delai - minDelai) / (double) range;
        return round2(bd(15).multiply(BigDecimal.ONE.subtract(BigDecimal.valueOf(ratio))));
    }

    private BigDecimal scoreQualite(int notation) {
        return round2(bd(15).multiply(BigDecimal.valueOf(notation / 5.0)));
    }

    private BigDecimal scoreHistorique(OffreFournisseur rep) {
        BigDecimal base = bd(3);
        BigDecimal bonus = totalHt(rep).divide(HISTORIQUE_DIVISOR, 8, RoundingMode.HALF_UP).multiply(bd(7));
        return cap(round2(base.add(bonus)), bd(10));
    }

    private BigDecimal scoreArt187(AppelOffreAchat ao, OffreFournisseur rep) {
        if (StringUtils.hasText(ao.getChantierId()) && rep.isRetenue()) {
            return bd(10);
        }
        if (StringUtils.hasText(ao.getChantierId())) {
            return bd(4);
        }
        return bd(8);
    }

    private Recommendation recommend(BigDecimal scoreFinal, OffreFournisseur rep, AppelOffreAchat ao) {
        int delai = delaiJours(rep);
        if (delai > DELAI_REF_JOURS * 2) {
            return new Recommendation(
                    "A_EXCLURE", "Délai de livraison jugé excessif vs besoin chantier.");
        }
        if (scoreFinal.compareTo(bd(82)) >= 0) {
            return new Recommendation("OK", "Offre compétitive sur l'ensemble des critères.");
        }
        if (scoreFinal.compareTo(bd(65)) >= 0) {
            return new Recommendation("OK", "Offre acceptable — vérifier conditions particulières.");
        }
        if (delai > DELAI_REF_JOURS) {
            return new Recommendation(
                    "A_VERIFIER", "Délai au-delà de la référence — arbitrage direction achats.");
        }
        return new Recommendation("A_VERIFIER", "Score modéré — comparer avec alternatives.");
    }

    private int resolveNotation(String fournisseurId, Map<String, Integer> notationById) {
        if (!StringUtils.hasText(fournisseurId) || notationById == null || notationById.isEmpty()) {
            return DEFAULT_NOTATION;
        }
        return notationById.getOrDefault(fournisseurId.trim(), DEFAULT_NOTATION);
    }

    private List<ScoringOffreLigneDto> mapOffreLignes(OffreFournisseur rep) {
        if (rep.getLignes() == null || rep.getLignes().isEmpty()) {
            return List.of();
        }
        List<ScoringOffreLigneDto> lignes = new ArrayList<>();
        for (OffreFournisseurLigne ligne : rep.getLignes()) {
            UUID aoLigneId = ligne.getAppelOffreLigne() != null ? ligne.getAppelOffreLigne().getId() : null;
            lignes.add(ScoringOffreLigneDto.builder()
                    .id(ligne.getId())
                    .reponseId(rep.getId())
                    .aoLigneId(aoLigneId)
                    .prixUnitaireHt(ligne.getPrixUnitaireHt())
                    .totalHt(ligne.getTotalHt())
                    .delaiSpecifique(ligne.getDelaiSpecifique())
                    .build());
        }
        return lignes;
    }

    private BigDecimal totalHt(OffreFournisseur rep) {
        return rep.getTotalHt() != null ? rep.getTotalHt() : BigDecimal.ZERO;
    }

    private int delaiJours(OffreFournisseur rep) {
        return rep.getDelaiLivraisonJours() != null ? rep.getDelaiLivraisonJours() : 0;
    }

    private BigDecimal cap(BigDecimal value, BigDecimal max) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.min(max);
    }

    private BigDecimal capSum(BigDecimal... parts) {
        BigDecimal sum = BigDecimal.ZERO;
        for (BigDecimal part : parts) {
            sum = sum.add(part != null ? part : BigDecimal.ZERO);
        }
        return round2(sum);
    }

    private BigDecimal round2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal bd(double value) {
        return BigDecimal.valueOf(value);
    }

    private record Recommendation(String label, String raison) {}
}
