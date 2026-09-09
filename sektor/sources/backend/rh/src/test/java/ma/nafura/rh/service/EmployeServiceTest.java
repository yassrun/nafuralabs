package ma.nafura.rh.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.request.EmployeCreateDto;
import ma.nafura.rh.api.request.EmployeUpdateDto;
import ma.nafura.rh.domain.employe.Employe;
import ma.nafura.rh.repository.EmployeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ma.nafura.rh.seeders.EmployeSeedService;

@ExtendWith(MockitoExtension.class)
class EmployeServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private EmployeRepository repository;

    @Mock
    private EmployeSeedService seedService;

    @Mock
    private RhReferentielBinder referentielBinder;

    @InjectMocks
    private EmployeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void list_seedsAndFiltersBySearch() {
        Employe match = sampleEmploye("emp-001", "MAT-001", "Alami", "Karim");
        Employe other = sampleEmploye("emp-002", "MAT-002", "Benali", "Sara");
        when(repository.findByTenantIdOrderByNomAscPrenomAsc(TENANT_ID)).thenReturn(List.of(match, other));

        List<Employe> rows = service.list(null, null, null, "alami");

        verify(seedService).seedIfEmpty();
        assertThat(rows).hasSize(1);
        assertThat(rows.getFirst().getNom()).isEqualTo("Alami");
    }

    @Test
    void list_filtersByIdPrefix() {
        Employe match = sampleEmploye("qa-emp-chef-chantier", "QA-CHEFCH", "Chef Chantier", "QA");
        Employe other = sampleEmploye("qa-emp-daf", "QA-DAF", "Daf", "QA");
        when(repository.findByTenantIdOrderByNomAscPrenomAsc(TENANT_ID)).thenReturn(List.of(match, other));

        List<Employe> rows = service.list(null, null, null, "qa-emp-chef");

        assertThat(rows).extracting(Employe::getId).containsExactly("qa-emp-chef-chantier");
    }

    @Test
    void list_filtersByStatut() {
        when(repository.findByTenantIdAndStatutOrderByNomAscPrenomAsc(TENANT_ID, Employe.STATUT_ACTIF))
                .thenReturn(List.of(sampleEmploye("emp-001", "MAT-001", "Alami", "Karim")));

        List<Employe> rows = service.list(Employe.STATUT_ACTIF, null, null, null);

        verify(seedService).seedIfEmpty();
        assertThat(rows).hasSize(1);
    }

    @Test
    void getById_resolvesByMatricule() {
        Employe entity = sampleEmploye("emp-001", "MAT-001", "Alami", "Karim");
        when(repository.findByIdAndTenantId("MAT-001", TENANT_ID)).thenReturn(Optional.empty());
        when(repository.findByTenantIdAndMatricule(TENANT_ID, "MAT-001")).thenReturn(Optional.of(entity));

        Employe found = service.getById("MAT-001");

        assertThat(found.getId()).isEqualTo("emp-001");
    }

    @Test
    void create_assignsMatriculeWhenMissing() {
        EmployeCreateDto request = createRequest(null);
        when(referentielBinder.bind(any(), any(), any(), any()))
                .thenReturn(new RhReferentielBinder.Bound("rh-pst-001", "Ouvrier", null, null));
        when(repository.findByIdAndTenantId(any(), eq(TENANT_ID))).thenReturn(Optional.empty());
        when(repository.findByTenantIdOrderByNomAscPrenomAsc(TENANT_ID)).thenReturn(List.of());
        when(repository.save(any(Employe.class))).thenAnswer(inv -> inv.getArgument(0));

        Employe created = service.create(request);

        ArgumentCaptor<Employe> captor = ArgumentCaptor.forClass(Employe.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getMatricule()).isEqualTo("MAT-001");
        assertThat(created.getStatut()).isEqualTo(Employe.STATUT_ACTIF);
    }

    @Test
    void create_rejectsDuplicateId() {
        EmployeCreateDto request = createRequest("emp-001");
        when(repository.findByIdAndTenantId("emp-001", TENANT_ID))
                .thenReturn(Optional.of(sampleEmploye("emp-001", "MAT-001", "Alami", "Karim")));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void update_changesPoste() {
        Employe existing = sampleEmploye("emp-001", "MAT-001", "Alami", "Karim");
        when(repository.findByIdAndTenantId("emp-001", TENANT_ID)).thenReturn(Optional.of(existing));
        when(repository.save(any(Employe.class))).thenAnswer(inv -> inv.getArgument(0));
        when(referentielBinder.bind(any(), eq("Chef de chantier"), any(), any()))
                .thenReturn(new RhReferentielBinder.Bound("rh-pst-002", "Chef de chantier", null, null));

        EmployeUpdateDto update = new EmployeUpdateDto();
        update.setPoste("Chef de chantier");

        Employe updated = service.update("emp-001", update);

        assertThat(updated.getPoste()).isEqualTo("Chef de chantier");
    }

    @Test
    void delete_removesEntity() {
        Employe existing = sampleEmploye("emp-001", "MAT-001", "Alami", "Karim");
        when(repository.findByIdAndTenantId("emp-001", TENANT_ID)).thenReturn(Optional.of(existing));

        service.delete("emp-001");

        verify(repository).delete(existing);
    }

    private static Employe sampleEmploye(String id, String matricule, String nom, String prenom) {
        return Employe.builder()
                .id(id)
                .tenantId(TENANT_ID)
                .matricule(matricule)
                .nom(nom)
                .prenom(prenom)
                .cin("AB123456")
                .posteId("rh-pst-001")
                .poste("Ouvrier")
                .categorie("OUVRIER")
                .typeContrat("CDI")
                .statut(Employe.STATUT_ACTIF)
                .dateEmbauche(LocalDate.of(2024, 1, 15))
                .salaireBase(BigDecimal.valueOf(4500))
                .build();
    }

    private static EmployeCreateDto createRequest(String id) {
        EmployeCreateDto dto = new EmployeCreateDto();
        dto.setId(id);
        dto.setNom("Alami");
        dto.setPrenom("Karim");
        dto.setCin("AB123456");
        dto.setCnss("1234567");
        dto.setPosteId("rh-pst-001");
        dto.setPoste("Ouvrier");
        dto.setCategorie("OUVRIER");
        dto.setTypeContrat("CDI");
        dto.setDateEmbauche(LocalDate.of(2026, 1, 1));
        dto.setSalaireBase(BigDecimal.valueOf(4500));
        return dto;
    }
}
