package ma.nafura.chantiers.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.request.LigneBdpUpdateDto;
import ma.nafura.chantiers.api.request.PosteBudgetaireCreateDto;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ma.nafura.chantiers.seeders.PosteBudgetaireSeedService;

@ExtendWith(MockitoExtension.class)
class PosteBudgetaireServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final String LOT_ID = "ch-001-lot-01";

    @Mock private PosteBudgetaireRepository repository;
    @Mock private ChantierLotRepository lotRepository;
    @Mock private PosteBudgetaireSeedService seedService;

    @InjectMocks private PosteBudgetaireService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
        TenantContext.setTenantEnabled(true);
        lenient()
                .when(lotRepository.findByIdAndTenantId(LOT_ID, TENANT_ID))
                .thenReturn(Optional.of(ChantierLot.builder().id(LOT_ID).tenantId(TENANT_ID).build()));
        lenient()
                .when(repository.findByTenantIdAndLotIdAndCode(any(), any(), any()))
                .thenReturn(Optional.empty());
        lenient().when(repository.findByIdAndTenantId(any(), any())).thenReturn(Optional.empty());
        lenient().when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void generatesSequentialCodeWithinLotWhenCodeIsMissing() {
        when(repository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(TENANT_ID, LOT_ID))
                .thenReturn(List.of(poste("01", 1), poste("02", 2)));

        PosteBudgetaireCreateDto request = request("Béton", null);

        PosteBudgetaire created = service.create(LOT_ID, request);

        assertEquals("03", created.getCode());
        assertEquals("ch-001-lot-01-poste-03", created.getId());
    }

    @Test
    void preservesExplicitCode() {
        PosteBudgetaireCreateDto request = request("Poste manuel", "P-MANUEL");

        PosteBudgetaire created = service.create(LOT_ID, request);

        assertEquals("P-MANUEL", created.getCode());
    }

    /** AC-3 — la saisie ne produit que de l'interne. */
    @Test
    void saisieProduitUnPosteInterneSansOrigine() {
        PosteBudgetaire created = service.create(LOT_ID, request("Base vie", "P-INT"));

        assertEquals(NatureLigne.INTERNE, created.getNature());
        assertNull(created.getDpgfNoeudId());
    }

    /** AC-3 — une demande explicite de vendu est refusee, pas convertie en silence. */
    @Test
    void saisieRefuseUnVenduDemandeExplicitement() {
        PosteBudgetaireCreateDto request = request("Faux vendu", "P-01");
        request.setNature("VENDU");

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> service.create(LOT_ID, request));
        assertEquals("chantiers.arbre.vendu_par_saisie_refuse", ex.getMessage());
    }

    /** AC-4 — un montant vendu pose sur une ligne interne est refuse. */
    @Test
    void saisieRefuseUnPrixDeVente() {
        PosteBudgetaireCreateDto request = request("Base vie", "P-02");
        request.setPrixUnitaireHt(new BigDecimal("1200"));

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> service.create(LOT_ID, request));
        assertEquals("chantiers.arbre.interne_sans_prix_de_vente", ex.getMessage());
    }

    /** AC-2, AC-3 — la copie est le seul producteur de vendu, et elle pose le lien retour. */
    @Test
    void copieProduitUnPosteVenduAvecSonOrigine() {
        UUID origine = UUID.fromString("00000000-0000-4000-8000-0000000000bb");
        PosteBudgetaireCreateDto request = request("Beton arme", "P-03");
        request.setQuantite(new BigDecimal("10"));
        request.setPrixUnitaireHt(new BigDecimal("1500"));

        PosteBudgetaire created = service.copierPosteVendu(LOT_ID, request, origine);

        assertEquals(NatureLigne.VENDU, created.getNature());
        assertEquals(origine, created.getDpgfNoeudId());
        assertEquals(new BigDecimal("1500"), created.getPrixUnitaireHt());
        assertEquals(0, new BigDecimal("15000").compareTo(created.getMontantHt()));
    }

    /** AC-2 — un vendu sans origine n'existe pas. */
    @Test
    void copieRefuseUnVenduSansOrigine() {
        PosteBudgetaireCreateDto request = request("Beton arme", "P-04");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.copierPosteVendu(LOT_ID, request, null));
        assertEquals("chantiers.arbre.vendu_sans_origine", ex.getMessage());
    }

    /** BDP chiffré — une ligne vendue, sans origine d'étude, entre au bordereau du chantier. */
    @Test
    void chiffrageCreeUneLigneVendueSansOrigine() {
        PosteBudgetaireCreateDto request = request("Beton arme", "P-05");
        request.setNature("VENDU");
        request.setQuantite(new BigDecimal("12"));
        request.setPrixUnitaireHt(new BigDecimal("900"));

        PosteBudgetaire created = service.creerLigneBdp(LOT_ID, request);

        assertEquals(NatureLigne.VENDU, created.getNature());
        assertNull(created.getDpgfNoeudId());
        assertEquals(0, new BigDecimal("10800").compareTo(created.getMontantHt()));
    }

    /** BDP chiffré — un prix déclaré suffit à faire entrer la ligne au bordereau. */
    @Test
    void chiffrageDeduitLeVenduDuPrixFourni() {
        PosteBudgetaireCreateDto request = request("Enduit", "P-06");
        request.setQuantite(new BigDecimal("30"));
        request.setPrixUnitaireHt(new BigDecimal("45"));

        PosteBudgetaire created = service.creerLigneBdp(LOT_ID, request);

        assertEquals(NatureLigne.VENDU, created.getNature());
        assertEquals(0, new BigDecimal("1350").compareTo(created.getMontantHt()));
    }

    /** BDP chiffré — une ligne vendue sans quantité ni prix est refusée, jamais devinée. */
    @Test
    void chiffrageRefuseUneLigneVendueSansQuantiteNiPrix() {
        PosteBudgetaireCreateDto request = request("Faux vendu", "P-07");
        request.setNature("VENDU");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.creerLigneBdp(LOT_ID, request));
        assertEquals("chantiers.bdp.ligne_vendue_sans_quantite_ni_prix", ex.getMessage());
    }

    /** BDP chiffré — une ligne sans prix reste interne, comme la saisie générique. */
    @Test
    void chiffrageSansPrixResteInterne() {
        PosteBudgetaire created = service.creerLigneBdp(LOT_ID, request("Base vie", "P-08"));

        assertEquals(NatureLigne.INTERNE, created.getNature());
        assertNull(created.getPrixUnitaireHt());
    }

    /** Une ligne copiée du devis garde son origine : sa nature ne se convertit pas. */
    @Test
    void chiffrageNeConvertitPasUneLigneDOrigineEtude() {
        UUID origine = UUID.fromString("00000000-0000-4000-8000-0000000000cc");
        PosteBudgetaire existant = poste("01", 1);
        existant.setNature(NatureLigne.VENDU);
        existant.setDpgfNoeudId(origine);
        when(repository.findByIdAndTenantId(existant.getId(), TENANT_ID)).thenReturn(Optional.of(existant));

        LigneBdpUpdateDto maj = new LigneBdpUpdateDto();
        maj.setNature("INTERNE");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.majLigneBdp(existant.getId(), maj));
        assertEquals("chantiers.bdp.ligne_etude_non_convertible", ex.getMessage());
        assertEquals(NatureLigne.VENDU, existant.getNature());
    }

    /** Chiffrage — une ligne interne peut entrer au bordereau et porter son prix. */
    @Test
    void chiffrageFaitEntrerUneLigneInterneAuBordereau() {
        PosteBudgetaire existant = poste("02", 2);
        when(repository.findByIdAndTenantId(existant.getId(), TENANT_ID)).thenReturn(Optional.of(existant));

        LigneBdpUpdateDto maj = new LigneBdpUpdateDto();
        maj.setNature("VENDU");
        maj.setQuantite(new BigDecimal("4"));
        maj.setPrixUnitaireHt(new BigDecimal("250"));

        PosteBudgetaire updated = service.majLigneBdp(existant.getId(), maj);

        assertEquals(NatureLigne.VENDU, updated.getNature());
        assertEquals(0, new BigDecimal("1000").compareTo(updated.getMontantHt()));
    }

    /** Une ligne vendue du bordereau sans quantité ni prix est refusée au chiffrage. */
    @Test
    void chiffrageRefuseUneMiseAJourVendueSansQuantiteNiPrix() {
        PosteBudgetaire existant = poste("04", 4);
        when(repository.findByIdAndTenantId(existant.getId(), TENANT_ID)).thenReturn(Optional.of(existant));

        LigneBdpUpdateDto maj = new LigneBdpUpdateDto();
        maj.setNature("VENDU");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.majLigneBdp(existant.getId(), maj));
        assertEquals("chantiers.bdp.ligne_vendue_sans_quantite_ni_prix", ex.getMessage());
    }

    /** Retour à l'interne : la ligne quitte le bordereau et son prix de vente. */
    @Test
    void chiffrageRessortUneLigneDuBordereau() {
        PosteBudgetaire existant = poste("03", 3);
        existant.setNature(NatureLigne.VENDU);
        existant.setQuantite(new BigDecimal("4"));
        existant.setPrixUnitaireHt(new BigDecimal("250"));
        existant.setMontantHt(new BigDecimal("1000"));
        when(repository.findByIdAndTenantId(existant.getId(), TENANT_ID)).thenReturn(Optional.of(existant));

        LigneBdpUpdateDto maj = new LigneBdpUpdateDto();
        maj.setNature("INTERNE");

        PosteBudgetaire updated = service.majLigneBdp(existant.getId(), maj);

        assertEquals(NatureLigne.INTERNE, updated.getNature());
        assertNull(updated.getPrixUnitaireHt());
        assertNull(updated.getMontantHt());
    }

    private static PosteBudgetaireCreateDto request(String designation, String code) {
        PosteBudgetaireCreateDto request = new PosteBudgetaireCreateDto();
        request.setDesignation(designation);
        request.setCode(code);
        return request;
    }

    private static PosteBudgetaire poste(String code, int ordre) {
        return PosteBudgetaire.builder()
                .id(LOT_ID + "-poste-" + code)
                .tenantId(TENANT_ID)
                .lotId(LOT_ID)
                .code(code)
                .designation(code)
                .ordre(ordre)
                .build();
    }
}
