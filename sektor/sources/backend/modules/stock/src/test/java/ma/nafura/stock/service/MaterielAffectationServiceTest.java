package ma.nafura.stock.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.item.domain.model.Materiel;
import ma.nafura.item.repository.MaterielRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.stock.api.request.MaterielAffectationCreateDto;
import ma.nafura.stock.domain.model.MaterielAffectation;
import ma.nafura.stock.repository.MaterielAffectationRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MaterielAffectationServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID MATERIEL_ID = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    private static final UUID AFF_ID = UUID.fromString("cccccccc-cccc-4ccc-8ccc-cccccccccccc");

    @Mock
    private MaterielAffectationRepository repository;

    @Mock
    private MaterielRepository materielRepository;

    @InjectMocks
    private MaterielAffectationService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
        TenantContext.setTenantEnabled(true);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void cloreSetsClosedStatusAndSyncsMateriel() {
        MaterielAffectation aff = MaterielAffectation.builder()
                .id(AFF_ID)
                .tenantId(TENANT_ID)
                .materielId(MATERIEL_ID)
                .chantierRef("PROJ-001")
                .dateDebut(LocalDate.of(2026, 1, 1))
                .status(MaterielAffectation.STATUS_ACTIVE)
                .build();
        Materiel materiel = Materiel.builder()
                .id(MATERIEL_ID)
                .tenantId(TENANT_ID)
                .code("ENG-001")
                .name("Pelle")
                .numeroSerie("SN")
                .status("AFFECTE")
                .isActive(true)
                .build();

        when(repository.findByIdAndTenantId(AFF_ID, TENANT_ID)).thenReturn(Optional.of(aff));
        when(repository.save(any(MaterielAffectation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(materielRepository.findByIdAndTenantId(MATERIEL_ID, TENANT_ID)).thenReturn(Optional.of(materiel));
        when(repository.findFirstByTenantIdAndMaterielIdAndStatusOrderByDateDebutDesc(
                        TENANT_ID, MATERIEL_ID, MaterielAffectation.STATUS_ACTIVE))
                .thenReturn(Optional.empty());
        when(materielRepository.save(any(Materiel.class))).thenAnswer(inv -> inv.getArgument(0));

        MaterielAffectation closed = service.clore(AFF_ID, null);

        assertEquals(MaterielAffectation.STATUS_CLOSED, closed.getStatus());
        assertNotNull(closed.getDateFin());
        assertEquals("DISPONIBLE", materiel.getStatus());
    }

    @Test
    void createActiveAffectationMarksMaterielAffecte() {
        Materiel materiel = Materiel.builder()
                .id(MATERIEL_ID)
                .tenantId(TENANT_ID)
                .code("ENG-001")
                .name("Pelle")
                .numeroSerie("SN")
                .status("DISPONIBLE")
                .isActive(true)
                .build();

        MaterielAffectationCreateDto dto = new MaterielAffectationCreateDto();
        dto.setMaterielId(MATERIEL_ID);
        dto.setChantierRef("PROJ-001");
        dto.setDateDebut(LocalDate.of(2026, 5, 1));
        dto.setLocationName("Chantier Atlas");

        MaterielAffectation saved = MaterielAffectation.builder()
                .id(AFF_ID)
                .tenantId(TENANT_ID)
                .materielId(MATERIEL_ID)
                .materielName("Pelle")
                .chantierRef("PROJ-001")
                .dateDebut(LocalDate.of(2026, 5, 1))
                .locationName("Chantier Atlas")
                .status(MaterielAffectation.STATUS_ACTIVE)
                .build();

        when(materielRepository.findByIdAndTenantId(MATERIEL_ID, TENANT_ID)).thenReturn(Optional.of(materiel));
        when(repository.save(any(MaterielAffectation.class))).thenReturn(saved);
        when(repository.findFirstByTenantIdAndMaterielIdAndStatusOrderByDateDebutDesc(
                        TENANT_ID, MATERIEL_ID, MaterielAffectation.STATUS_ACTIVE))
                .thenReturn(Optional.of(saved));
        when(materielRepository.save(any(Materiel.class))).thenAnswer(inv -> inv.getArgument(0));

        service.create(dto);

        assertEquals("AFFECTE", materiel.getStatus());
        assertEquals("Chantier Atlas", materiel.getChantierActuelName());
    }
}
