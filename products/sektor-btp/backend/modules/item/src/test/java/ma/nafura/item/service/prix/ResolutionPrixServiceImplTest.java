package ma.nafura.item.service.prix;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.currency.service.CurrencyConversionService;
import ma.nafura.item.domain.BasePrixChiffrage;
import ma.nafura.item.domain.PriceType;
import ma.nafura.item.domain.SourcePrix;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.domain.model.ItemPrice;
import ma.nafura.item.repository.ItemPriceRepository;
import ma.nafura.item.repository.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ResolutionPrixServiceImplTest {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private ItemPriceRepository itemPriceRepository;

    @Mock
    private PrixAchatExternePort prixAchatExternePort;

    @Mock
    private CurrencyConversionService currencyConversionService;

    private ResolutionPrixServiceImpl service;
    private UUID tenantId;
    private UUID itemId;
    private UUID deviseId;
    private LocalDate date;

    @BeforeEach
    void setUp() {
        service = new ResolutionPrixServiceImpl(
                itemRepository, itemPriceRepository, prixAchatExternePort, currencyConversionService);
        tenantId = UUID.randomUUID();
        itemId = UUID.randomUUID();
        deviseId = UUID.randomUUID();
        date = LocalDate.of(2026, 6, 15);
        lenient()
                .when(currencyConversionService.convert(any(), any(), any(), any(), any()))
                .thenAnswer(inv -> inv.getArgument(3));
    }

    private ContexteResolution ctx(String base) {
        return new ContexteResolution(tenantId, date, null, null, deviseId, base);
    }

    @Test
    void niveau1_consulte() {
        when(prixAchatExternePort.findOffreRetenue(eq(itemId), any()))
                .thenReturn(Optional.of(candidat(SourcePrix.CONSULTE, "1.10")));
        PrixResolu r = service.resoudrePrixAchat(itemId, ctx(BasePrixChiffrage.MARCHE));
        assertEquals(SourcePrix.CONSULTE, r.sourcePrix());
        assertEquals(new BigDecimal("1.10"), r.prixUnitaire());
    }

    @Test
    void niveau2_contrat() {
        when(prixAchatExternePort.findOffreRetenue(eq(itemId), any())).thenReturn(Optional.empty());
        when(prixAchatExternePort.findContrat(eq(itemId), any()))
                .thenReturn(Optional.of(candidat(SourcePrix.CONTRAT, "1.20")));
        PrixResolu r = service.resoudrePrixAchat(itemId, ctx(BasePrixChiffrage.MARCHE));
        assertEquals(SourcePrix.CONTRAT, r.sourcePrix());
    }

    @Test
    void niveau3_catalogue() {
        emptyExternesSaufCatalogue();
        when(prixAchatExternePort.findCatalogue(eq(itemId), any()))
                .thenReturn(Optional.of(candidat(SourcePrix.CATALOGUE, "1.30")));
        PrixResolu r = service.resoudrePrixAchat(itemId, ctx(BasePrixChiffrage.MARCHE));
        assertEquals(SourcePrix.CATALOGUE, r.sourcePrix());
    }

    @Test
    void niveau4_tarif() {
        emptyExternes();
        ItemPrice price = ItemPrice.builder()
                .id(UUID.randomUUID())
                .unitPrice(new BigDecimal("1.40"))
                .priceType(PriceType.ACHAT_STANDARD)
                .currencyId(deviseId)
                .effectiveFrom(date.minusDays(10))
                .build();
        when(itemPriceRepository.findEffective(tenantId, itemId, PriceType.ACHAT_STANDARD, date))
                .thenReturn(List.of(price));
        PrixResolu r = service.resoudrePrixAchat(itemId, ctx(BasePrixChiffrage.MARCHE));
        assertEquals(SourcePrix.TARIF, r.sourcePrix());
        assertEquals(new BigDecimal("1.40"), r.prixUnitaire());
    }

    @Test
    void niveau5_historique() {
        emptyExternes();
        when(itemPriceRepository.findEffective(any(), any(), any(), any())).thenReturn(List.of());
        when(prixAchatExternePort.findDerniereFacture(eq(itemId), any()))
                .thenReturn(Optional.of(candidat(SourcePrix.HISTORIQUE, "1.50")));
        PrixResolu r = service.resoudrePrixAchat(itemId, ctx(BasePrixChiffrage.MARCHE));
        assertEquals(SourcePrix.HISTORIQUE, r.sourcePrix());
    }

    @Test
    void niveau6_pmp() {
        emptyExternes();
        when(itemPriceRepository.findEffective(any(), any(), any(), any())).thenReturn(List.of());
        when(itemRepository.findByIdAndTenantId(itemId, tenantId))
                .thenReturn(Optional.of(Item.builder().id(itemId).pmp(new BigDecimal("1.60")).build()));
        PrixResolu r = service.resoudrePrixAchat(itemId, ctx(BasePrixChiffrage.MARCHE));
        assertEquals(SourcePrix.PMP, r.sourcePrix());
        assertEquals(new BigDecimal("1.60"), r.prixUnitaire());
    }

    @Test
    void niveau7_manuel() {
        emptyExternes();
        when(itemPriceRepository.findEffective(any(), any(), any(), any())).thenReturn(List.of());
        when(itemRepository.findByIdAndTenantId(itemId, tenantId)).thenReturn(Optional.of(Item.builder().id(itemId).build()));
        PrixResolu r = service.resoudrePrixAchat(itemId, ctx(BasePrixChiffrage.MARCHE));
        assertEquals(SourcePrix.MANUEL, r.sourcePrix());
        assertNull(r.prixUnitaire());
    }

    @Test
    void basePmpInversePriorite() {
        emptyExternes();
        // lenient() : en base PMP la résolution s'arrête au PMP, donc TARIF et CATALOGUE ne
        // sont jamais consultés. On les stube quand même pour documenter le scénario —
        // un prix catalogue EXISTE (1.00) et doit être supplanté par le PMP (2.00).
        lenient().when(itemPriceRepository.findEffective(any(), any(), any(), any())).thenReturn(List.of());
        when(itemRepository.findByIdAndTenantId(itemId, tenantId))
                .thenReturn(Optional.of(Item.builder().id(itemId).pmp(new BigDecimal("2.00")).build()));
        lenient().when(prixAchatExternePort.findCatalogue(eq(itemId), any()))
                .thenReturn(Optional.of(candidat(SourcePrix.CATALOGUE, "1.00")));
        // With PMP base: CONSULTE (empty) → PMP before CATALOGUE
        when(prixAchatExternePort.findOffreRetenue(eq(itemId), any())).thenReturn(Optional.empty());
        PrixResolu r = service.resoudrePrixAchat(itemId, ctx(BasePrixChiffrage.PMP));
        assertEquals(SourcePrix.PMP, r.sourcePrix());
    }

    @Test
    void prixPerimeSignale() {
        emptyExternes();
        when(prixAchatExternePort.findCatalogue(eq(itemId), any()))
                .thenReturn(Optional.of(new PrixCandidat(
                        new BigDecimal("1.00"),
                        SourcePrix.CATALOGUE,
                        UUID.randomUUID(),
                        date.minusYears(1),
                        deviseId,
                        "Catalogue périmé",
                        true)));
        PrixResolu r = service.resoudrePrixAchat(itemId, ctx(BasePrixChiffrage.MARCHE));
        assertTrue(r.perime());
    }

    @Test
    void conversionDevise() {
        UUID eur = UUID.randomUUID();
        when(prixAchatExternePort.findOffreRetenue(eq(itemId), any())).thenReturn(Optional.empty());
        when(prixAchatExternePort.findContrat(eq(itemId), any())).thenReturn(Optional.empty());
        when(prixAchatExternePort.findCatalogue(eq(itemId), any()))
                .thenReturn(Optional.of(new PrixCandidat(
                        new BigDecimal("10.00"),
                        SourcePrix.CATALOGUE,
                        UUID.randomUUID(),
                        date,
                        eur,
                        "Catalogue EUR",
                        false)));
        when(currencyConversionService.convert(eq(tenantId), eq(eur), eq(deviseId), eq(new BigDecimal("10.00")), eq(date)))
                .thenReturn(new BigDecimal("110.00"));
        PrixResolu r = service.resoudrePrixAchat(itemId, ctx(BasePrixChiffrage.MARCHE));
        assertEquals(0, new BigDecimal("110.0000").compareTo(r.prixUnitaire()));
        assertEquals(deviseId, r.currencyId());
    }

    // lenient() : la résolution court-circuite au premier niveau qui répond, donc les
    // sources situées plus bas dans la hiérarchie ne sont pas consultées par tous les tests.
    private void emptyExternes() {
        lenient().when(prixAchatExternePort.findOffreRetenue(eq(itemId), any())).thenReturn(Optional.empty());
        lenient().when(prixAchatExternePort.findContrat(eq(itemId), any())).thenReturn(Optional.empty());
        lenient().when(prixAchatExternePort.findCatalogue(eq(itemId), any())).thenReturn(Optional.empty());
        lenient().when(prixAchatExternePort.findDerniereFacture(eq(itemId), any())).thenReturn(Optional.empty());
    }

    private void emptyExternesSaufCatalogue() {
        lenient().when(prixAchatExternePort.findOffreRetenue(eq(itemId), any())).thenReturn(Optional.empty());
        lenient().when(prixAchatExternePort.findContrat(eq(itemId), any())).thenReturn(Optional.empty());
        lenient().when(prixAchatExternePort.findDerniereFacture(eq(itemId), any())).thenReturn(Optional.empty());
    }

    private PrixCandidat candidat(String source, String prix) {
        return new PrixCandidat(
                new BigDecimal(prix), source, UUID.randomUUID(), date, deviseId, source, false);
    }
}
