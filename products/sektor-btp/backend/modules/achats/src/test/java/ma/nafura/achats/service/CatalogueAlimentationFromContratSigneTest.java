package ma.nafura.achats.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.domain.CatalogueSource;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.achats.domain.model.ContratFournisseur;
import ma.nafura.achats.repository.CatalogueFournisseurLigneRepository;
import ma.nafura.currency.service.CurrencyConversionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CatalogueAlimentationFromContratSigneTest {

    @Mock
    private CatalogueFournisseurLigneService catalogueService;

    @Mock
    private CatalogueFournisseurLigneRepository catalogueRepository;

    @Mock
    private CurrencyConversionService currencyConversionService;

    @Mock
    private BonCommandeAchatService bonCommandeAchatService;

    private CatalogueAlimentationService service;

    @BeforeEach
    void setUp() {
        service = new CatalogueAlimentationService(
                catalogueService, catalogueRepository, currencyConversionService, bonCommandeAchatService);
    }

    @Test
    void fromContratSigne_sansLignes_noOpSansErreur() {
        UUID tenantId = UUID.randomUUID();
        UUID contratId = UUID.randomUUID();
        ContratFournisseur contrat = ContratFournisseur.builder()
                .id(contratId)
                .tenantId(tenantId)
                .dateDebut(LocalDate.of(2026, 1, 1))
                .dateFin(LocalDate.of(2026, 12, 31))
                .build();
        when(catalogueRepository.findByTenantIdAndSourceAndSourceRefId(
                        tenantId, CatalogueSource.CONTRAT, contratId))
                .thenReturn(List.of());

        assertDoesNotThrow(() -> service.fromContratSigne(contrat));
        verify(catalogueRepository, never()).save(any());
    }

    @Test
    void fromContratSigne_avecLignes_ouvreSurPeriodeDuContrat() {
        UUID tenantId = UUID.randomUUID();
        UUID contratId = UUID.randomUUID();
        LocalDate debut = LocalDate.of(2026, 3, 1);
        LocalDate fin = LocalDate.of(2027, 2, 28);
        ContratFournisseur contrat = ContratFournisseur.builder()
                .id(contratId)
                .tenantId(tenantId)
                .dateDebut(debut)
                .dateFin(fin)
                .build();

        CatalogueFournisseurLigne ligne = CatalogueFournisseurLigne.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .source(CatalogueSource.CONTRAT)
                .sourceRefId(contratId)
                .articleId(UUID.randomUUID().toString())
                .fournisseurId("F-1")
                .designation("Ciment")
                .prixUnitaireHt(new BigDecimal("1.15"))
                .actif(false)
                .validFrom(LocalDate.of(2025, 1, 1))
                .validTo(null)
                .build();

        when(catalogueRepository.findByTenantIdAndSourceAndSourceRefId(
                        tenantId, CatalogueSource.CONTRAT, contratId))
                .thenReturn(List.of(ligne));
        when(catalogueRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.fromContratSigne(contrat);

        assertEquals(debut, ligne.getValidFrom());
        assertEquals(fin, ligne.getValidTo());
        assertTrue(Boolean.TRUE.equals(ligne.getActif()));
        verify(catalogueRepository).save(ligne);
    }

    @Test
    void fromContratSigne_neTouchePasLignesAutreTenant_memeSourceRefId() {
        UUID tenantA = UUID.randomUUID();
        UUID tenantB = UUID.randomUUID();
        UUID sharedSourceRefId = UUID.randomUUID();
        LocalDate debut = LocalDate.of(2026, 1, 1);
        LocalDate fin = LocalDate.of(2026, 12, 31);

        ContratFournisseur contratA = ContratFournisseur.builder()
                .id(sharedSourceRefId)
                .tenantId(tenantA)
                .dateDebut(debut)
                .dateFin(fin)
                .build();

        CatalogueFournisseurLigne ligneB = CatalogueFournisseurLigne.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantB)
                .source(CatalogueSource.CONTRAT)
                .sourceRefId(sharedSourceRefId)
                .articleId("ART-B")
                .fournisseurId("F-B")
                .designation("Prix tenant B")
                .prixUnitaireHt(new BigDecimal("9.99"))
                .actif(false)
                .validFrom(LocalDate.of(2025, 1, 1))
                .validTo(null)
                .build();

        // Seul le tenant A est interrogé — la ligne B ne doit jamais remonter
        when(catalogueRepository.findByTenantIdAndSourceAndSourceRefId(
                        tenantA, CatalogueSource.CONTRAT, sharedSourceRefId))
                .thenReturn(List.of());

        service.fromContratSigne(contratA);

        verify(catalogueRepository)
                .findByTenantIdAndSourceAndSourceRefId(tenantA, CatalogueSource.CONTRAT, sharedSourceRefId);
        verify(catalogueRepository, never())
                .findByTenantIdAndSourceAndSourceRefId(eq(tenantB), any(), any());
        verify(catalogueRepository, never()).save(any());
        assertFalse(Boolean.TRUE.equals(ligneB.getActif()));
        assertNull(ligneB.getValidTo());
    }
}
