package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.OuvrageLookupDto;
import ma.nafura.etudes.api.request.ComposantOuvrageInputDto;
import ma.nafura.etudes.api.request.OuvrageCreateDto;
import ma.nafura.etudes.api.request.OuvrageUpdateDto;
import ma.nafura.etudes.api.request.UniteMainInputDto;
import ma.nafura.etudes.domain.model.ComposantOuvrage;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.domain.model.UniteMain;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;

@ExtendWith(MockitoExtension.class)
class OuvrageServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private OuvrageRepository repository;

    @Mock
    private OuvrageSeedService seedService;

    @Mock
    private DpuService dpuService;

    @InjectMocks
    private OuvrageService service;

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
        Ouvrage match = sampleOuvrage("OUV-001", "Décapage terre végétale");
        Ouvrage other = sampleOuvrage("OUV-002", "Béton armé fondations");
        when(repository.findByTenantIdOrderByCodeAsc(TENANT_ID)).thenReturn(List.of(match, other));

        Page<Ouvrage> page = service.list(null, null, null, null, "décapage", null, null, 0, 20);

        verify(seedService).seedIfEmpty();
        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().getFirst().getCode()).isEqualTo("OUV-001");
    }

    @Test
    void create_persistsOuvrageWithComputedTotals() {
        OuvrageCreateDto request = createRequest("OUV-NEW", "Nouvel ouvrage");
        when(repository.existsByTenantIdAndCode(TENANT_ID, "OUV-NEW")).thenReturn(false);
        when(repository.save(any(Ouvrage.class))).thenAnswer(invocation -> {
            Ouvrage saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        Ouvrage created = service.create(request);

        verify(repository).save(any(Ouvrage.class));
        assertThat(created.getCode()).isEqualTo("OUV-NEW");
        assertThat(created.getPrixUnitaireHt()).isGreaterThan(BigDecimal.ZERO);
        assertThat(created.getComposants()).hasSize(1);
    }

    @Test
    void create_rejectsDuplicateCode() {
        OuvrageCreateDto request = createRequest("OUV-DUP", "Doublon");
        when(repository.existsByTenantIdAndCode(TENANT_ID, "OUV-DUP")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void getById_returnsOuvrageWithDpuAttached() {
        UUID id = UUID.randomUUID();
        Ouvrage entity = sampleOuvrage("OUV-001", "Décapage");
        entity.setId(id);
        when(repository.findByIdAndTenantId(id, TENANT_ID)).thenReturn(Optional.of(entity));
        doAnswer(invocation -> {
            Ouvrage ouvrage = invocation.getArgument(0);
            ouvrage.setDpuId(UUID.randomUUID());
            return null;
        })
                .when(dpuService)
                .attachToOuvrage(entity);

        Ouvrage result = service.getById(id);

        verify(seedService).seedIfEmpty();
        assertThat(result.getId()).isEqualTo(id);
        assertThat(result.getDpuId()).isNotNull();
    }

    @Test
    void getById_throwsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndTenantId(id, TENANT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(id))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void update_changesDesignationAndRecomputesTotals() {
        UUID id = UUID.randomUUID();
        Ouvrage entity = sampleOuvrage("OUV-001", "Avant");
        entity.setId(id);
        when(repository.findByIdAndTenantId(id, TENANT_ID)).thenReturn(Optional.of(entity));
        when(repository.save(any(Ouvrage.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OuvrageUpdateDto update = new OuvrageUpdateDto();
        update.setDesignation("Après mise à jour");

        Ouvrage updated = service.update(id, update);

        assertThat(updated.getDesignation()).isEqualTo("Après mise à jour");
        verify(repository).save(entity);
    }

    @Test
    void delete_removesEntity() {
        UUID id = UUID.randomUUID();
        Ouvrage entity = sampleOuvrage("OUV-DEL", "À supprimer");
        entity.setId(id);
        when(repository.findByIdAndTenantId(id, TENANT_ID)).thenReturn(Optional.of(entity));

        service.delete(id);

        verify(repository).delete(entity);
    }

    @Test
    void lookup_returnsActiveMatchesOnly() {
        Ouvrage active = sampleOuvrage("OUV-001", "Décapage actif");
        active.setId(UUID.randomUUID());
        active.setIsActive(true);
        Ouvrage inactive = sampleOuvrage("OUV-002", "Décapage inactif");
        inactive.setId(UUID.randomUUID());
        inactive.setIsActive(false);
        when(repository.findByTenantIdOrderByCodeAsc(TENANT_ID)).thenReturn(List.of(active, inactive));

        List<OuvrageLookupDto> results = service.lookup("OUV-001");

        verify(seedService).seedIfEmpty();
        assertThat(results).hasSize(1);
        assertThat(results.getFirst().getCode()).isEqualTo("OUV-001");
        assertThat(results.getFirst().getLabel()).contains("Décapage actif");
    }

    private static Ouvrage sampleOuvrage(String code, String designation) {
        return Ouvrage.builder()
                .tenantId(TENANT_ID)
                .code(code)
                .designation(designation)
                .category("TERRASSEMENT")
                .unite("m³")
                .prixUnitaireHt(new BigDecimal("100.00"))
                .sousTotalDebourse(new BigDecimal("80.00"))
                .uniteMain(UniteMain.builder()
                        .heures(BigDecimal.ZERO)
                        .tauxHoraire(BigDecimal.ZERO)
                        .total(BigDecimal.ZERO)
                        .build())
                .fraisGenerauxPercent(new BigDecimal("8"))
                .beneficePercent(new BigDecimal("7"))
                .isActive(true)
                .derniereMaj(LocalDate.of(2026, 4, 15))
                .composants(new ArrayList<>())
                .build();
    }

    private static OuvrageCreateDto createRequest(String code, String designation) {
        OuvrageCreateDto dto = new OuvrageCreateDto();
        dto.setCode(code);
        dto.setDesignation(designation);
        dto.setCategory("TERRASSEMENT");
        dto.setUnite("m³");
        UniteMainInputDto mo = new UniteMainInputDto();
        mo.setHeures(new BigDecimal("1"));
        mo.setTauxHoraire(new BigDecimal("50"));
        dto.setUniteMain(mo);
        ComposantOuvrageInputDto comp = new ComposantOuvrageInputDto();
        comp.setType(ComposantOuvrage.TYPE_MATERIAU);
        comp.setDesignation("Ciment");
        comp.setUnite("kg");
        comp.setRendement(new BigDecimal("10"));
        comp.setPrixUnitaire(new BigDecimal("1.5"));
        dto.setComposants(List.of(comp));
        return dto;
    }
}
