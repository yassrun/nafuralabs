package ma.nafura.chantiers.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.ChantierLotTreeResponseDto;
import ma.nafura.chantiers.api.request.ChantierLotCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotTreeNodeCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotTreePosteCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotTreeRequestDto;
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
import ma.nafura.chantiers.seeders.ChantierLotSeedService;

@ExtendWith(MockitoExtension.class)
class ChantierLotServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final String CHANTIER_ID = "ch-001";

    @Mock private ChantierLotRepository repository;
    @Mock private ChantierService chantierService;
    @Mock private ChantierLotSeedService seedService;
    @Mock private ChantierProgressSyncService progressSyncService;
    @Mock private PosteBudgetaireRepository posteRepository;
    @Mock private PosteBudgetaireService posteBudgetaireService;

    @InjectMocks private ChantierLotService service;

    private final List<ChantierLot> storedLots = new ArrayList<>();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
        TenantContext.setTenantEnabled(true);
        storedLots.clear();
        lenient()
                .when(repository.findByTenantIdAndChantierIdAndCode(any(), any(), any()))
                .thenReturn(Optional.empty());
        lenient()
                .when(repository.findByIdAndTenantId(any(), any()))
                .thenAnswer(invocation -> {
                    String id = invocation.getArgument(0);
                    return storedLots.stream().filter(lot -> lot.getId().equals(id)).findFirst();
                });
        lenient()
                .when(repository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(TENANT_ID, CHANTIER_ID))
                .thenAnswer(invocation -> List.copyOf(storedLots));
        lenient()
                .when(repository.save(any()))
                .thenAnswer(invocation -> {
                    ChantierLot lot = invocation.getArgument(0);
                    storedLots.removeIf(existing -> existing.getId().equals(lot.getId()));
                    storedLots.add(lot);
                    return lot;
                });
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void generatesSequentialRootCodeWhenCodeIsMissing() {
        storedLots.add(lot("root-1", "01", null, 1));

        ChantierLot created = service.create(CHANTIER_ID, request("Terrassement", null));

        assertEquals("02", created.getCode());
        assertEquals("ch-001-lot-02", created.getId());
    }

    @Test
    void generatesParentScopedChildCode() {
        storedLots.add(lot("root-1", "01", null, 1));
        storedLots.add(lot("child-1", "01-01", "root-1", 2));

        ChantierLotCreateDto request = request("Sous-lot", null);
        request.setParentLotId("root-1");

        ChantierLot created = service.create(CHANTIER_ID, request);

        assertEquals("01-02", created.getCode());
        assertEquals("root-1", created.getParentLotId());
    }

    @Test
    void preservesExplicitCode() {
        ChantierLot created = service.create(CHANTIER_ID, request("Lot manuel", "MANUEL"));

        assertEquals("MANUEL", created.getCode());
    }

    @Test
    void rejectsLotDeeperThanMaxDepth() {
        storedLots.add(lot("root-1", "01", null, 1));
        storedLots.add(lot("l2", "01-01", "root-1", 2));
        storedLots.add(lot("l3", "01-01-01", "l2", 3));

        ChantierLotCreateDto request = request("Too deep", null);
        request.setParentLotId("l3");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.create(CHANTIER_ID, request));
        assertEquals("Lot hierarchy depth exceeds maximum of 3 levels", ex.getMessage());
    }

    @Test
    void allowsLotAtMaxDepth() {
        storedLots.add(lot("root-1", "01", null, 1));
        storedLots.add(lot("l2", "01-01", "root-1", 2));

        ChantierLotCreateDto request = request("Sous-sous-lot", null);
        request.setParentLotId("l2");

        ChantierLot created = service.create(CHANTIER_ID, request);

        assertEquals("01-01-01", created.getCode());
        assertEquals("l2", created.getParentLotId());
    }

    @Test
    void createTreePersistsNestedLotsAndPostes() {
        when(posteBudgetaireService.create(any(), any())).thenAnswer(invocation -> {
            String lotId = invocation.getArgument(0);
            PosteBudgetaireCreateDto dto = invocation.getArgument(1);
            return PosteBudgetaire.builder()
                    .id(lotId + "-poste-" + dto.getOrdre())
                    .tenantId(TENANT_ID)
                    .lotId(lotId)
                    .code(String.format("%02d", dto.getOrdre()))
                    .designation(dto.getDesignation())
                    .unite(dto.getUnite())
                    .quantite(dto.getQuantite())
                    .prixUnitaireHt(dto.getPrixUnitaireHt())
                    .montantHt(dto.getMontantHt())
                    .ordre(dto.getOrdre() != null ? dto.getOrdre() : 1)
                    .build();
        });

        // Import d'arbre = saisie : le poste est interne (AC-3) et ne porte pas de prix de
        // vente (AC-4).
        ChantierLotTreePosteCreateDto poste = new ChantierLotTreePosteCreateDto();
        poste.setDesignation("Porte bois");
        poste.setUnite("U");
        poste.setQuantite(BigDecimal.ONE);

        ChantierLotTreeNodeCreateDto l3 = new ChantierLotTreeNodeCreateDto();
        l3.setDesignation("Cadres");
        l3.setPostes(List.of(poste));

        ChantierLotTreeNodeCreateDto l2 = new ChantierLotTreeNodeCreateDto();
        l2.setDesignation("MENUISERIE BOIS");
        l2.setChildren(List.of(l3));

        ChantierLotTreeNodeCreateDto l1 = new ChantierLotTreeNodeCreateDto();
        l1.setDesignation("MENUISERIE");
        l1.setChildren(List.of(l2));

        ChantierLotTreeRequestDto treeRequest = new ChantierLotTreeRequestDto();
        treeRequest.setLots(List.of(l1));

        ChantierLotTreeResponseDto response = service.createTree(CHANTIER_ID, treeRequest);

        assertEquals(1, response.getLots().size());
        assertEquals("01", response.getLots().get(0).getCode());
        assertEquals(0, response.getLots().get(0).getDepth());
        assertEquals("01-01", response.getLots().get(0).getChildren().get(0).getCode());
        assertEquals(1, response.getLots().get(0).getChildren().get(0).getDepth());
        assertEquals(
                "01-01-01",
                response.getLots().get(0).getChildren().get(0).getChildren().get(0).getCode());
        assertEquals(
                2, response.getLots().get(0).getChildren().get(0).getChildren().get(0).getDepth());
        assertEquals(
                "Porte bois",
                response.getLots()
                        .get(0)
                        .getChildren()
                        .get(0)
                        .getChildren()
                        .get(0)
                        .getPostes()
                        .get(0)
                        .getDesignation());
        assertEquals(
                "01",
                response.getLots()
                        .get(0)
                        .getChildren()
                        .get(0)
                        .getChildren()
                        .get(0)
                        .getPostes()
                        .get(0)
                        .getCode());
    }

    @Test
    void createTreeRejectsDepthBeyondMax() {
        ChantierLotTreeNodeCreateDto tooDeep = new ChantierLotTreeNodeCreateDto();
        tooDeep.setDesignation("L4");

        ChantierLotTreeNodeCreateDto l3 = new ChantierLotTreeNodeCreateDto();
        l3.setDesignation("L3");
        l3.setChildren(List.of(tooDeep));

        ChantierLotTreeNodeCreateDto l2 = new ChantierLotTreeNodeCreateDto();
        l2.setDesignation("L2");
        l2.setChildren(List.of(l3));

        ChantierLotTreeNodeCreateDto l1 = new ChantierLotTreeNodeCreateDto();
        l1.setDesignation("L1");
        l1.setChildren(List.of(l2));

        ChantierLotTreeRequestDto treeRequest = new ChantierLotTreeRequestDto();
        treeRequest.setLots(List.of(l1));

        assertThrows(IllegalArgumentException.class, () -> service.createTree(CHANTIER_ID, treeRequest));
    }

    /** AC-3 — la saisie ne produit que de l'interne, AC-1 la nature est toujours posee. */
    @Test
    void saisieProduitUnLotInterneSansOrigine() {
        ChantierLot created = service.create(CHANTIER_ID, request("Installation de chantier", null));

        assertEquals(NatureLigne.INTERNE, created.getNature());
        assertNull(created.getDpgfNoeudId());
        assertNull(created.getPrixUnitaireHt());
        assertNull(created.getMontantHt());
    }

    /** AC-3 — une demande explicite de vendu est refusee, pas convertie en silence. */
    @Test
    void saisieRefuseUnVenduDemandeExplicitement() {
        ChantierLotCreateDto request = request("Faux vendu", null);
        request.setNature("VENDU");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.create(CHANTIER_ID, request));
        assertEquals("chantiers.arbre.vendu_par_saisie_refuse", ex.getMessage());
    }

    /** AC-4 — un montant vendu pose sur une ligne interne est refuse. */
    @Test
    void saisieRefuseUnPrixDeVente() {
        ChantierLotCreateDto request = request("Base vie", null);
        request.setMontantHt(new BigDecimal("50000"));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.create(CHANTIER_ID, request));
        assertEquals("chantiers.arbre.interne_sans_prix_de_vente", ex.getMessage());
    }

    /** AC-2, AC-3 — la copie est le seul producteur de vendu, et elle pose le lien retour. */
    @Test
    void copieProduitUnLotVenduAvecSonOrigine() {
        UUID origine = UUID.fromString("00000000-0000-4000-8000-0000000000cc");
        ChantierLotCreateDto request = request("Gros oeuvre", null);
        request.setQuantite(new BigDecimal("2"));
        request.setPrixUnitaireHt(new BigDecimal("2500"));

        ChantierLot created = service.copierLotVendu(CHANTIER_ID, request, origine);

        assertEquals(NatureLigne.VENDU, created.getNature());
        assertEquals(origine, created.getDpgfNoeudId());
        assertEquals(new BigDecimal("2500"), created.getPrixUnitaireHt());
        assertEquals(0, new BigDecimal("5000").compareTo(created.getMontantHt()));
    }

    /** AC-2 — un vendu sans origine n'existe pas. */
    @Test
    void copieRefuseUnVenduSansOrigine() {
        ChantierLotCreateDto request = request("Gros oeuvre", null);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.copierLotVendu(CHANTIER_ID, request, null));
        assertEquals("chantiers.arbre.vendu_sans_origine", ex.getMessage());
    }

    /** AC-1 — la nature et l'origine sont rendues par l'endpoint de lecture de l'arbre. */
    @Test
    void arbreRendLaNatureDeChaqueLigne() {
        when(posteBudgetaireService.create(any(), any())).thenAnswer(invocation -> {
            String lotId = invocation.getArgument(0);
            PosteBudgetaireCreateDto dto = invocation.getArgument(1);
            return PosteBudgetaire.builder()
                    .id(lotId + "-poste-1")
                    .tenantId(TENANT_ID)
                    .lotId(lotId)
                    .code("01")
                    .designation(dto.getDesignation())
                    .nature(NatureLigne.INTERNE)
                    .ordre(1)
                    .build();
        });

        ChantierLotTreePosteCreateDto poste = new ChantierLotTreePosteCreateDto();
        poste.setDesignation("Base vie");

        ChantierLotTreeNodeCreateDto l1 = new ChantierLotTreeNodeCreateDto();
        l1.setDesignation("Installation");
        l1.setPostes(List.of(poste));

        ChantierLotTreeRequestDto treeRequest = new ChantierLotTreeRequestDto();
        treeRequest.setLots(List.of(l1));

        ChantierLotTreeResponseDto response = service.createTree(CHANTIER_ID, treeRequest);

        assertEquals(NatureLigne.INTERNE, response.getLots().get(0).getNature());
        assertNull(response.getLots().get(0).getDpgfNoeudId());
        assertEquals(
                NatureLigne.INTERNE, response.getLots().get(0).getPostes().get(0).getNature());
    }

    private static ChantierLotCreateDto request(String designation, String code) {
        ChantierLotCreateDto request = new ChantierLotCreateDto();
        request.setDesignation(designation);
        request.setCode(code);
        return request;
    }

    private static ChantierLot lot(String id, String code, String parentLotId, int ordre) {
        return ChantierLot.builder()
                .id(id)
                .tenantId(TENANT_ID)
                .chantierId(CHANTIER_ID)
                .code(code)
                .designation(code)
                .parentLotId(parentLotId)
                .nature(NatureLigne.INTERNE)
                .ordre(ordre)
                .build();
    }
}
