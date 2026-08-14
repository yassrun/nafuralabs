package ma.nafura.achats.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.dto.MatchingReceptionDto;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.BonCommandeAchatLigne;
import ma.nafura.achats.domain.model.FactureFournisseur;
import ma.nafura.achats.domain.model.FactureFournisseurLigne;
import ma.nafura.achats.domain.model.ReceptionAchat;
import ma.nafura.achats.domain.model.ReceptionAchatLigne;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class MatchingThreeWayServiceTest {

    private MatchingThreeWayService service;
    private final UUID bcId = UUID.randomUUID();
    private final UUID ligneId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new MatchingThreeWayService();
    }

    @Test
    void ecartBloqueWhenInvoicePriceOutsideTolerance() {
        BonCommandeAchat bc = sampleBc();
        ReceptionAchat reception = sampleReception(bcId, ligneId, new BigDecimal("10"));
        FactureFournisseur ff = sampleFacture(bcId, ligneId, new BigDecimal("150"), new BigDecimal("10"));

        MatchingReceptionDto m = service.compute(bc, List.of(reception), ff, MatchingThreeWayService.DEFAULT_TOLERANCE);

        assertThat(m.getStatus()).isEqualTo("ECART_BLOQUE");
        assertThat(m.isMatched3Way()).isFalse();
        assertThat(m.getLignes().get(0).isBloquant()).isTrue();
    }

    @Test
    void matched3WayWhenBcBlAndInvoiceAlignedWithinTolerance() {
        BonCommandeAchat bc = sampleBc();
        ReceptionAchat reception = sampleReception(bcId, ligneId, new BigDecimal("10"));
        FactureFournisseur ff = sampleFacture(bcId, ligneId, new BigDecimal("100"), new BigDecimal("10"));

        MatchingReceptionDto m = service.compute(bc, List.of(reception), ff, MatchingThreeWayService.DEFAULT_TOLERANCE);

        assertThat(m.getStatus()).isEqualTo("FACTURE_COMPLET");
        assertThat(m.isMatched3Way()).isTrue();
    }

    private BonCommandeAchat sampleBc() {
        BonCommandeAchat bc = BonCommandeAchat.builder()
                .id(bcId)
                .numero("BC-TEST-001")
                .fournisseurId("f1")
                .dateCreation(LocalDate.parse("2026-01-01"))
                .dateLivraisonPrevue(LocalDate.parse("2026-02-01"))
                .conditionsPaiement("30j")
                .totalHt(new BigDecimal("1000"))
                .tvaTaux(new BigDecimal("20"))
                .totalTtc(new BigDecimal("1200"))
                .status(BonCommandeAchat.STATUS_VALIDE)
                .lignes(List.of(BonCommandeAchatLigne.builder()
                        .id(ligneId)
                        .articleId("art-a")
                        .quantite(new BigDecimal("10"))
                        .quantiteLivree(new BigDecimal("10"))
                        .quantiteFacturee(BigDecimal.ZERO)
                        .prixUnitaireHt(new BigDecimal("100"))
                        .totalHt(new BigDecimal("1000"))
                        .build()))
                .build();
        bc.getLignes().forEach(l -> l.setBonCommande(bc));
        return bc;
    }

    private ReceptionAchat sampleReception(UUID bcUuid, UUID bcLigneId, BigDecimal qty) {
        ReceptionAchat reception = ReceptionAchat.builder()
                .id(UUID.randomUUID())
                .bonCommandeAchatId(bcUuid)
                .numero("REC-1")
                .dateReception(LocalDate.parse("2026-01-10"))
                .status(ReceptionAchat.STATUS_VALIDE)
                .lignes(List.of(ReceptionAchatLigne.builder()
                        .bonCommandeLigneId(bcLigneId)
                        .articleId("art-a")
                        .quantiteRecue(qty)
                        .build()))
                .build();
        reception.getLignes().forEach(l -> l.setReception(reception));
        return reception;
    }

    private FactureFournisseur sampleFacture(UUID bcUuid, UUID bcLigneId, BigDecimal unitPrice, BigDecimal qty) {
        UUID ffId = UUID.randomUUID();
        FactureFournisseur ff = FactureFournisseur.builder()
                .id(ffId)
                .numeroInterne("FF-1")
                .fournisseurId("f1")
                .bcId(bcUuid)
                .bcNumero("BC-TEST-001")
                .dateFacture(LocalDate.parse("2026-01-15"))
                .dateEcheance(LocalDate.parse("2026-02-15"))
                .status(FactureFournisseur.STATUS_BROUILLON)
                .lignes(List.of(FactureFournisseurLigne.builder()
                        .designation("A")
                        .ordre(1)
                        .bcLigneId(bcLigneId)
                        .compteCode("6111")
                        .quantite(qty)
                        .prixUnitaireHt(unitPrice)
                        .totalHt(unitPrice.multiply(qty))
                        .tvaTaux(BigDecimal.ZERO)
                        .build()))
                .build();
        ff.getLignes().forEach(l -> l.setFacture(ff));
        return ff;
    }
}
