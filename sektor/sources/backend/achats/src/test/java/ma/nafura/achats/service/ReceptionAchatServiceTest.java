package ma.nafura.achats.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.request.ReceptionAchatCreateDto;
import ma.nafura.achats.api.request.ReceptionAchatLigneInputDto;
import ma.nafura.achats.domain.commande.BonCommandeAchat;
import ma.nafura.achats.domain.commande.BonCommandeAchatLigne;
import ma.nafura.achats.domain.reception.ReceptionAchat;
import ma.nafura.achats.repository.ReceptionAchatRepository;
import ma.nafura.achats.service.port.ReceptionImputationChantierPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReceptionAchatServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID BC_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID LIGNE_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock private ReceptionAchatRepository repository;
    @Mock private BonCommandeAchatService bonCommandeService;
    @Mock private ReceptionStockMovementService stockMovementService;
    @Mock private ObjectProvider<ReceptionImputationChantierPort> imputationPort;
    @Mock private ReceptionImputationChantierPort port;

    private ReceptionAchatService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new ReceptionAchatService(
                repository, bonCommandeService, stockMovementService, imputationPort);
        when(repository.countByTenantId(TENANT)).thenReturn(0L);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(imputationPort.getIfAvailable()).thenReturn(port);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void receptionDirecteSansMagasin_pasDeMouvementStock() {
        BonCommandeAchat bc = bcEnvoye(new BigDecimal("40"), BigDecimal.ZERO);
        when(bonCommandeService.getById(BC_ID)).thenReturn(bc);

        ReceptionAchat rec = service.create(BC_ID, receptionDto(new BigDecimal("40"), null));

        verify(stockMovementService, never()).createAndValidateReception(any(), any(), any(), any());
        assertThat(bc.getLignes().getFirst().getQuantiteLivree()).isEqualByComparingTo("40");
        ArgumentCaptor<BigDecimal> montant = ArgumentCaptor.forClass(BigDecimal.class);
        verify(port).imputerReel(
                eq("ch-1"), eq("poste-2-1"), montant.capture(), any(), any(), any());
        assertThat(montant.getValue()).isEqualByComparingTo("43350.0000");
        assertThat(rec.getBlNumero()).isEqualTo("44012");
    }

    @Test
    void receptionPartielle_laisseLeReste() {
        BonCommandeAchat bc = bcEnvoye(new BigDecimal("25"), BigDecimal.ZERO);
        when(bonCommandeService.getById(BC_ID)).thenReturn(bc);

        service.create(BC_ID, receptionDto(new BigDecimal("12"), null));

        BonCommandeAchatLigne ligne = bc.getLignes().getFirst();
        assertThat(ligne.getQuantiteLivree()).isEqualByComparingTo("12");
        assertThat(ligne.getQuantite().subtract(ligne.getQuantiteLivree())).isEqualByComparingTo("13");
        assertThat(bc.getStatus()).isEqualTo(BonCommandeAchat.STATUS_PARTIELLEMENT_LIVRE);
    }

    @Test
    void quantiteRecueSupCommandee_refuseSansEcretage() {
        BonCommandeAchat bc = bcEnvoye(new BigDecimal("25"), BigDecimal.ZERO);
        when(bonCommandeService.getById(BC_ID)).thenReturn(bc);

        assertThatThrownBy(() -> service.create(BC_ID, receptionDto(new BigDecimal("30"), null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(ReceptionAchatService.ERR_QTE_EXCEDE_RESTE);
        assertThat(bc.getLignes().getFirst().getQuantiteLivree()).isEqualByComparingTo("0");
        verify(stockMovementService, never()).createAndValidateReception(any(), any(), any(), any());
    }

    private static BonCommandeAchat bcEnvoye(BigDecimal qte, BigDecimal livree) {
        BonCommandeAchatLigne ligne = BonCommandeAchatLigne.builder()
                .id(LIGNE_ID)
                .articleId("art-1")
                .quantite(qte)
                .quantiteLivree(livree)
                .prixUnitaireHt(new BigDecimal("1083.75"))
                .totalHt(qte.multiply(new BigDecimal("1083.75")))
                .build();
        BonCommandeAchat bc = BonCommandeAchat.builder()
                .id(BC_ID)
                .numero("BC-1")
                .chantierId("ch-1")
                .noeudId("poste-2-1")
                .status(BonCommandeAchat.STATUS_ENVOYE)
                .totalHt(ligne.getTotalHt())
                .tvaTaux(new BigDecimal("20"))
                .totalLivreHt(BigDecimal.ZERO)
                .lignes(new ArrayList<>(List.of(ligne)))
                .build();
        ligne.setBonCommande(bc);
        return bc;
    }

    private static ReceptionAchatCreateDto receptionDto(BigDecimal qty, UUID dest) {
        ReceptionAchatLigneInputDto ligne = new ReceptionAchatLigneInputDto();
        ligne.setBonCommandeLigneId(LIGNE_ID);
        ligne.setArticleId("art-1");
        ligne.setQuantiteRecue(qty);
        ReceptionAchatCreateDto dto = new ReceptionAchatCreateDto();
        dto.setDestLocationId(dest);
        dto.setDateReception(LocalDate.parse("2026-09-12"));
        dto.setBlNumero("44012");
        dto.setLignes(List.of(ligne));
        return dto;
    }
}
