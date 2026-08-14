package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.CapitalisationResumeDto;
import ma.nafura.etudes.api.dto.CapitalisationVersementResultDto;
import ma.nafura.etudes.api.request.CapitalisationVerserDto;
import ma.nafura.etudes.api.request.OuvrageCreateDto;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import ma.nafura.etudes.domain.ouvrage.ComposantOuvrage;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.ouvrage.Ouvrage;
import ma.nafura.etudes.domain.dpu.PrixDpu;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CapitalisationOuvrageServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private DossierEtudeRepository dossierRepository;

    @Mock
    private DpgfNoeudRepository noeudRepository;

    @Mock
    private PrixDpuRepository prixDpuRepository;

    @Mock
    private OuvrageRepository ouvrageRepository;

    @Mock
    private OuvrageService ouvrageService;

    private CapitalisationOuvrageService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new CapitalisationOuvrageService(
                dossierRepository,
                noeudRepository,
                prixDpuRepository,
                ouvrageRepository,
                ouvrageService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void resume_listeDecomposeAvecCollision() {
        UUID dossierId = UUID.randomUUID();
        UUID dpgfId = UUID.randomUUID();
        UUID noeudId = UUID.randomUUID();
        UUID dpuId = UUID.randomUUID();

        DossierEtude dossier = dossier(dossierId, dpgfId, StatutDossierEtude.VALIDEE);
        when(dossierRepository.findByIdAndTenantId(dossierId, TENANT)).thenReturn(Optional.of(dossier));
        when(ouvrageRepository.findByTenantIdAndSourceEtudeId(TENANT, dossierId)).thenReturn(List.of());

        DpgfNoeud noeud = article(noeudId, "CLO-01", "Cloison", "DECOMPOSE");
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dpgfId, TENANT))
                .thenReturn(List.of(noeud));

        PrixDpu dpu = PrixDpu.builder()
                .id(dpuId)
                .tenantId(TENANT)
                .deboursSec(new BigDecimal("100.00"))
                .composants(new ArrayList<>(List.of(composantDpu("Ciment", "350"))))
                .build();
        when(prixDpuRepository.findByDpgfNoeudIdAndTenantId(noeudId, TENANT)).thenReturn(Optional.of(dpu));

        Ouvrage existing = Ouvrage.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT)
                .code("CLO-01")
                .designation("Cloison biblio")
                .composants(new ArrayList<>(List.of(composantOuvrage("Ciment", "320"))))
                .build();
        when(ouvrageRepository.findByTenantIdAndCode(TENANT, "CLO-01")).thenReturn(Optional.of(existing));

        CapitalisationResumeDto resume = service.resume(dossierId);

        assertThat(resume.isDossierValide()).isTrue();
        assertThat(resume.getTotalCandidats()).isEqualTo(1);
        assertThat(resume.getCollisions()).isEqualTo(1);
        assertThat(resume.getArticles().getFirst().getStatut())
                .isEqualTo(CapitalisationOuvrageService.STATUT_COLLISION);
        assertThat(resume.getArticles().getFirst().getComparaisonRendements()).isNotEmpty();
    }

    @Test
    void verser_refuseSiDossierNonValide() {
        UUID dossierId = UUID.randomUUID();
        when(dossierRepository.findByIdAndTenantId(dossierId, TENANT))
                .thenReturn(Optional.of(dossier(dossierId, UUID.randomUUID(), StatutDossierEtude.EN_ETUDE)));

        CapitalisationVerserDto body = new CapitalisationVerserDto();
        CapitalisationVerserDto.Selection sel = new CapitalisationVerserDto.Selection();
        sel.setNoeudId(UUID.randomUUID());
        body.setSelections(List.of(sel));

        assertThatThrownBy(() -> service.verser(dossierId, body))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("etudes.capitalisation.dossier_non_valide");
    }

    @Test
    void verser_creeNouveauSansEcrasement() {
        UUID dossierId = UUID.randomUUID();
        UUID dpgfId = UUID.randomUUID();
        UUID noeudId = UUID.randomUUID();
        UUID dpuId = UUID.randomUUID();

        DossierEtude dossier = dossier(dossierId, dpgfId, StatutDossierEtude.VALIDEE);
        when(dossierRepository.findByIdAndTenantId(dossierId, TENANT)).thenReturn(Optional.of(dossier));
        when(ouvrageRepository.findByTenantIdAndSourceEtudeId(TENANT, dossierId)).thenReturn(List.of());

        DpgfNoeud noeud = article(noeudId, "NEW-01", "Nouvel ouvrage", "DECOMPOSE");
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dpgfId, TENANT))
                .thenReturn(List.of(noeud));

        PrixDpu dpu = PrixDpu.builder()
                .id(dpuId)
                .tenantId(TENANT)
                .fraisGenerauxPercent(new BigDecimal("8"))
                .margeBeneficiairePercent(new BigDecimal("7"))
                .deboursSec(new BigDecimal("50.00"))
                .composants(new ArrayList<>(List.of(composantDpu("Sable", "1"))))
                .build();
        when(prixDpuRepository.findByDpgfNoeudIdAndTenantId(noeudId, TENANT)).thenReturn(Optional.of(dpu));
        when(ouvrageRepository.findByTenantIdAndCode(TENANT, "NEW-01")).thenReturn(Optional.empty());
        when(ouvrageRepository.existsByTenantIdAndCode(TENANT, "NEW-01")).thenReturn(false);
        when(prixDpuRepository.findByIdAndTenantId(dpuId, TENANT)).thenReturn(Optional.of(dpu));

        Ouvrage created = Ouvrage.builder().id(UUID.randomUUID()).code("NEW-01").build();
        when(ouvrageService.create(any(OuvrageCreateDto.class))).thenReturn(created);

        CapitalisationVerserDto body = new CapitalisationVerserDto();
        CapitalisationVerserDto.Selection sel = new CapitalisationVerserDto.Selection();
        sel.setNoeudId(noeudId);
        sel.setDecision(CapitalisationOuvrageService.DECISION_CREER);
        body.setSelections(List.of(sel));

        CapitalisationVersementResultDto result = service.verser(dossierId, body);

        assertThat(result.getCrees()).isEqualTo(1);
        ArgumentCaptor<OuvrageCreateDto> captor = ArgumentCaptor.forClass(OuvrageCreateDto.class);
        verify(ouvrageService).create(captor.capture());
        assertThat(captor.getValue().getOrigine()).isEqualTo("ETUDE");
        assertThat(captor.getValue().getSourceEtudeId()).isEqualTo(dossierId);
        assertThat(captor.getValue().getComposants()).hasSize(1);
        assertThat(captor.getValue().getComposants().getFirst().getRendement())
                .isEqualByComparingTo("1");
    }

    @Test
    void verser_collisionSansDecisionRefuse() {
        UUID dossierId = UUID.randomUUID();
        UUID dpgfId = UUID.randomUUID();
        UUID noeudId = UUID.randomUUID();
        UUID dpuId = UUID.randomUUID();

        DossierEtude dossier = dossier(dossierId, dpgfId, StatutDossierEtude.VALIDEE);
        when(dossierRepository.findByIdAndTenantId(dossierId, TENANT)).thenReturn(Optional.of(dossier));
        when(ouvrageRepository.findByTenantIdAndSourceEtudeId(TENANT, dossierId)).thenReturn(List.of());

        DpgfNoeud noeud = article(noeudId, "COLL", "Collision", "DECOMPOSE");
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dpgfId, TENANT))
                .thenReturn(List.of(noeud));

        PrixDpu dpu = PrixDpu.builder()
                .id(dpuId)
                .tenantId(TENANT)
                .composants(new ArrayList<>(List.of(composantDpu("X", "1"))))
                .build();
        when(prixDpuRepository.findByDpgfNoeudIdAndTenantId(noeudId, TENANT)).thenReturn(Optional.of(dpu));
        when(ouvrageRepository.findByTenantIdAndCode(eq(TENANT), eq("COLL")))
                .thenReturn(Optional.of(Ouvrage.builder()
                        .id(UUID.randomUUID())
                        .code("COLL")
                        .composants(new ArrayList<>())
                        .build()));

        CapitalisationVerserDto body = new CapitalisationVerserDto();
        CapitalisationVerserDto.Selection sel = new CapitalisationVerserDto.Selection();
        sel.setNoeudId(noeudId);
        sel.setDecision(CapitalisationOuvrageService.DECISION_CREER);
        body.setSelections(List.of(sel));

        assertThatThrownBy(() -> service.verser(dossierId, body))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("collision.decision_requise");
    }

    @Test
    void slugify_asciiKebab() {
        assertThat(CapitalisationOuvrageService.slugify("Cloison agglo 20cm"))
                .isEqualTo("cloison-agglo-20cm");
    }

    private static DossierEtude dossier(UUID id, UUID dpgfId, StatutDossierEtude status) {
        return DossierEtude.builder()
                .id(id)
                .tenantId(TENANT)
                .dpgfId(dpgfId)
                .status(status)
                .build();
    }

    private static DpgfNoeud article(UUID id, String code, String libelle, String origine) {
        return DpgfNoeud.builder()
                .id(id)
                .tenantId(TENANT)
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code(code)
                .libelle(libelle)
                .unite("m²")
                .origineCout(origine)
                .build();
    }

    private static ComposantDpu composantDpu(String libelle, String rendement) {
        return ComposantDpu.builder()
                .libelle(libelle)
                .unite("kg")
                .type(ComposantDpu.TYPE_MATIERE)
                .referenceType("LIBRE")
                .rendement(new BigDecimal(rendement))
                .prixUnitaire(new BigDecimal("1.5"))
                .total(new BigDecimal(rendement).multiply(new BigDecimal("1.5")))
                .build();
    }

    private static ComposantOuvrage composantOuvrage(String libelle, String rendement) {
        return ComposantOuvrage.builder()
                .libelle(libelle)
                .unite("kg")
                .type(ComposantOuvrage.TYPE_MATERIAU)
                .referenceType("LIBRE")
                .rendement(new BigDecimal(rendement))
                .prixUnitaire(new BigDecimal("1.5"))
                .total(new BigDecimal(rendement).multiply(new BigDecimal("1.5")))
                .build();
    }
}
