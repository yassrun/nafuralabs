package ma.nafura.achats.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.request.DemandeAchatCreateDto;
import ma.nafura.achats.api.request.DemandeAchatLigneInputDto;
import ma.nafura.achats.domain.demande.DemandeAchat;
import ma.nafura.achats.repository.DemandeAchatRepository;
import ma.nafura.achats.seeders.DemandeAchatSeedService;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DemandeAchatServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock private DemandeAchatRepository repository;
    @Mock private DemandeAchatSeedService seedService;

    private DemandeAchatService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new DemandeAchatService(repository, seedService);
        when(repository.countByTenantId(TENANT)).thenReturn(0L);
        when(repository.save(any())).thenAnswer(inv -> {
            DemandeAchat entity = inv.getArgument(0);
            if (entity.getId() == null) {
                entity.setId(UUID.randomUUID());
            }
            return entity;
        });
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void createSansChantier_refuse() {
        DemandeAchatCreateDto dto = baseDto();
        dto.setChantierId(null);
        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("achats.demande.chantier_requis");
    }

    @Test
    void createSurNoeud_persisteChantierEtNoeud() {
        DemandeAchatCreateDto dto = baseDto();
        dto.setChantierId("ch-al-qods");
        dto.setNoeudId("poste-2-1");
        DemandeAchat saved = service.create(dto);
        assertThat(saved.getChantierId()).isEqualTo("ch-al-qods");
        assertThat(saved.getNoeudId()).isEqualTo("poste-2-1");
        assertThat(saved.getLignes()).hasSize(1);
        assertThat(saved.getLignes().getFirst().getQuantite()).isEqualByComparingTo("40");
    }

    @Test
    void createSansNoeud_autoriseInterne() {
        DemandeAchatCreateDto dto = baseDto();
        dto.setChantierId("ch-al-qods");
        dto.setNoeudId(null);
        DemandeAchat saved = service.create(dto);
        assertThat(saved.getChantierId()).isEqualTo("ch-al-qods");
        assertThat(saved.getNoeudId()).isNull();
    }

    private static DemandeAchatCreateDto baseDto() {
        DemandeAchatLigneInputDto ligne = new DemandeAchatLigneInputDto();
        ligne.setArticleId(UUID.randomUUID().toString());
        ligne.setArticleCode("ciment-cpj-45");
        ligne.setArticleName("Ciment CPJ 45");
        ligne.setQuantite(new BigDecimal("40"));
        ligne.setUomCode("t");
        ligne.setPrixEstimeHt(new BigDecimal("1083.75"));
        DemandeAchatCreateDto dto = new DemandeAchatCreateDto();
        dto.setDateBesoin(LocalDate.parse("2026-09-10"));
        dto.setDemandeurId("qa-emp-conducteur");
        dto.setLignes(List.of(ligne));
        return dto;
    }
}
