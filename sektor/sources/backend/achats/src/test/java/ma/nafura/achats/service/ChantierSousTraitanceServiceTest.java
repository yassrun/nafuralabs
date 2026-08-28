package ma.nafura.achats.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.achats.api.dto.ContratSousTraitanceDto;
import ma.nafura.achats.api.request.ContratFournisseurCreateDto;
import ma.nafura.achats.api.request.ContratSousTraitanceCreateDto;
import ma.nafura.achats.domain.contrat.ContratFournisseur;
import ma.nafura.achats.repository.ContratFournisseurRepository;
import ma.nafura.achats.seeders.ContratFournisseurSousTraitanceSeedService;
import ma.nafura.achats.service.port.NoeudChantierPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;
import com.fasterxml.jackson.databind.ObjectMapper;

/** SEKTOR-224 — AC-8 contrat ST sur nœud vendu, refus sans nœud / INTERNE. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChantierSousTraitanceServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-al-qods";
    private static final String POSTE = "poste-2-3";

    @Mock private ContratFournisseurRepository repository;
    @Mock private ContratFournisseurService contratFournisseurService;
    @Mock private ContratFournisseurSousTraitanceSeedService seedService;
    @Mock private ObjectProvider<NoeudChantierPort> noeudPort;
    @Mock private NoeudChantierPort port;

    private ChantierSousTraitanceService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new ChantierSousTraitanceService(
                repository,
                contratFournisseurService,
                seedService,
                new ContratSousTraitanceNotes(new ObjectMapper()),
                noeudPort);
        when(noeudPort.getIfAvailable()).thenReturn(port);
        when(contratFournisseurService.create(any(ContratFournisseurCreateDto.class))).thenAnswer(inv -> {
            ContratFournisseurCreateDto req = inv.getArgument(0);
            return ContratFournisseur.builder()
                    .id(UUID.randomUUID())
                    .tenantId(TENANT)
                    .numero("ST-001")
                    .type(ContratFournisseur.TYPE_SOUS_TRAITANCE)
                    .fournisseurId(req.getFournisseurId())
                    .chantierId(req.getChantierId())
                    .dateDebut(req.getDateDebut())
                    .dateFin(req.getDateFin())
                    .status(ContratFournisseur.STATUS_BROUILLON)
                    .montantHt(req.getMontantHt())
                    .notes(req.getNotes())
                    .build();
        });
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void createSansNoeud_refuse() {
        ContratSousTraitanceCreateDto dto = base();
        dto.setNoeudId("  ");
        assertThatThrownBy(() -> service.create(CHANTIER, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ChantierSousTraitanceService.ERR_NOEUD_REQUIS);
    }

    @Test
    void createSurNoeudInterne_refuse() {
        doThrow(new IllegalArgumentException("achats.st.noeud_interne: " + POSTE))
                .when(port)
                .requirePosteVendu(CHANTIER, POSTE);
        assertThatThrownBy(() -> service.create(CHANTIER, base()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("achats.st.noeud_interne");
    }

    @Test
    void createSurNoeudVendu_persisteChantierNoeudBpuSansPourcentage() {
        ContratSousTraitanceDto saved = service.create(CHANTIER, base());
        assertThat(saved.getChantierId()).isEqualTo(CHANTIER);
        assertThat(saved.getNoeudId()).isEqualTo(POSTE);
        assertThat(saved.getBpuFichier()).isEqualTo("BPU-coffrage-2-3.pdf");
        assertThat(saved.getMontantHt()).isEqualByComparingTo("80750");
        verify(port).requirePosteVendu(CHANTIER, POSTE);
    }

    private static ContratSousTraitanceCreateDto base() {
        ContratSousTraitanceCreateDto dto = new ContratSousTraitanceCreateDto();
        dto.setSousTraitantId("st-coffreur");
        dto.setSousTraitantNom("Coffreurs Atlas");
        dto.setObjet("Coffrage poste 2.3");
        dto.setDateDebut(LocalDate.parse("2026-09-08"));
        dto.setDateFin(LocalDate.parse("2026-09-30"));
        dto.setMontantHt(new BigDecimal("80750"));
        dto.setRetenueGarantieTaux(new BigDecimal("7"));
        dto.setNoeudId(POSTE);
        dto.setBpuFichier("BPU-coffrage-2-3.pdf");
        return dto;
    }
}
