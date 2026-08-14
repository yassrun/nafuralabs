package ma.nafura.achats.service;

import static org.assertj.core.api.Assertions.assertThat;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.api.dto.AppelOffreComparatifDto;
import ma.nafura.achats.api.dto.ScoringAODto;
import ma.nafura.achats.domain.model.AppelOffreAchat;
import ma.nafura.achats.domain.model.AppelOffreLigne;
import ma.nafura.achats.domain.model.OffreFournisseur;
import ma.nafura.achats.domain.model.OffreFournisseurLigne;
import ma.nafura.achats.repository.AppelOffreAchatRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AppelOffreComparatifServiceTest {

    @Mock
    private AppelOffreAchatService appelOffreAchatService;

    @Mock
    private AppelOffreAchatRepository repository;

    private AppelOffreComparatifService service;

    private final UUID aoId = UUID.randomUUID();
    private final UUID ligneId = UUID.randomUUID();
    private final UUID repFaId = UUID.randomUUID();
    private final UUID repFbId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new AppelOffreComparatifService(appelOffreAchatService, repository);
    }

    @Test
    void prixScoreFavorsLowestTotal() {
        AppelOffreAchat ao = sampleAo();
        AppelOffreComparatifDto comparatif = service.buildComparatif(ao, Map.of("fa", 5, "fb", 3));

        ScoringAODto fa = findByFournisseur(comparatif, "fa");
        ScoringAODto fb = findByFournisseur(comparatif, "fb");

        assertThat(fa.getScoreDetail().getPrix()).isGreaterThanOrEqualTo(fb.getScoreDetail().getPrix());
    }

    @Test
    void marksTopOnBestEligibleSupplier() {
        AppelOffreAchat ao = sampleAo();
        AppelOffreComparatifDto comparatif = service.buildComparatif(ao, Map.of("fa", 5, "fb", 3));

        List<ScoringAODto> tops =
                comparatif.getScores().stream().filter(s -> "TOP".equals(s.getRecommandation())).toList();

        assertThat(tops).hasSize(1);
        assertThat(tops.get(0).getFournisseurId()).isEqualTo("fa");
    }

    private ScoringAODto findByFournisseur(AppelOffreComparatifDto comparatif, String fournisseurId) {
        return comparatif.getScores().stream()
                .filter(s -> fournisseurId.equals(s.getFournisseurId()))
                .findFirst()
                .orElseThrow();
    }

    private AppelOffreAchat sampleAo() {
        AppelOffreLigne ligne = AppelOffreLigne.builder()
                .id(ligneId)
                .tenantId(UUID.randomUUID())
                .articleId("x")
                .quantite(BigDecimal.TEN)
                .uomCode("u")
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        OffreFournisseur fa = offre(repFaId, "fa", "F-A", new BigDecimal("100000"), 5, true, ligne);
        OffreFournisseur fb = offre(repFbId, "fb", "F-B", new BigDecimal("120000"), 50, false, ligne);

        return AppelOffreAchat.builder()
                .id(aoId)
                .tenantId(UUID.randomUUID())
                .numero("AO-1")
                .objet("Test")
                .chantierId("ch-1")
                .dateLimiteDepot(LocalDate.parse("2026-02-01"))
                .status(AppelOffreAchat.STATUS_PUBLIEE)
                .fournisseurInvitesIds(List.of("fa", "fb"))
                .lignes(List.of(ligne))
                .reponses(List.of(fa, fb))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
    }

    private OffreFournisseur offre(
            UUID id,
            String fournisseurId,
            String name,
            BigDecimal totalHt,
            int delai,
            boolean retenue,
            AppelOffreLigne aoLigne) {
        OffreFournisseurLigne offreLigne = OffreFournisseurLigne.builder()
                .id(UUID.randomUUID())
                .tenantId(UUID.randomUUID())
                .appelOffreLigne(aoLigne)
                .prixUnitaireHt(totalHt.divide(BigDecimal.TEN, 4, java.math.RoundingMode.HALF_UP))
                .totalHt(totalHt)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        OffreFournisseur rep = OffreFournisseur.builder()
                .id(id)
                .tenantId(UUID.randomUUID())
                .fournisseurId(fournisseurId)
                .fournisseurName(name)
                .dateReponse(LocalDate.parse("2026-01-02"))
                .totalHt(totalHt)
                .delaiLivraisonJours(delai)
                .retenue(retenue)
                .lignes(List.of(offreLigne))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
        offreLigne.setOffre(rep);
        return rep;
    }
}
