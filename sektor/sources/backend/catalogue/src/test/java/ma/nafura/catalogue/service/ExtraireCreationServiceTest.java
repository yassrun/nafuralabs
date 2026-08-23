package ma.nafura.catalogue.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.api.dto.ExtraireCreerDto;
import ma.nafura.catalogue.api.request.ItemCreateDto;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.domain.ouvrage.CatalogArticle;
import ma.nafura.catalogue.repository.CatalogArticleRepository;
import ma.nafura.catalogue.repository.UnitOfMeasureRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExtraireCreationServiceTest {

    @Mock private CatalogArticleRepository articleRepository;
    @Mock private ItemService itemService;
    @Mock private UnitOfMeasureRepository unitOfMeasureRepository;

    private ExtraireCreationService service;
    private final UUID tenantId = UUID.randomUUID();
    private final UUID itemId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new ExtraireCreationService(articleRepository, itemService, unitOfMeasureRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void identiteAbsente_publieSektorPuisCreeItem() {
        when(articleRepository.findByCleStable("enduit-de-rebouchage")).thenReturn(Optional.empty());
        when(articleRepository.save(any(CatalogArticle.class))).thenAnswer(inv -> {
            CatalogArticle a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(UUID.randomUUID());
            }
            return a;
        });
        when(itemService.findByCleStable("enduit-de-rebouchage")).thenReturn(Optional.empty());
        when(itemService.create(any(ItemCreateDto.class))).thenReturn(Item.builder()
                .id(itemId)
                .cleStable("enduit-de-rebouchage")
                .name("Enduit de rebouchage")
                .build());

        ExtraireCreerDto out = service.creer("Enduit de rebouchage", "MATIERE", "KG", null);

        assertThat(out.createdSektor()).isTrue();
        assertThat(out.createdItem()).isTrue();
        assertThat(out.cleStable()).isEqualTo("enduit-de-rebouchage");
        ArgumentCaptor<CatalogArticle> captor = ArgumentCaptor.forClass(CatalogArticle.class);
        verify(articleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatut()).isEqualTo("PUBLIE");
        assertThat(captor.getValue().getCleStable()).isEqualTo("enduit-de-rebouchage");
    }

    @Test
    void identiteDejaPublieeSansItem_creeItemSeul() {
        CatalogArticle published = CatalogArticle.builder()
                .id(UUID.randomUUID())
                .cleStable("peinture-acrylique-interieure")
                .libelle("Peinture acrylique intérieure")
                .nature("MATIERE")
                .uniteCode("L")
                .statut("PUBLIE")
                .build();
        when(articleRepository.findByCleStable("peinture-acrylique-interieure"))
                .thenReturn(Optional.of(published));
        when(itemService.findByCleStable("peinture-acrylique-interieure")).thenReturn(Optional.empty());
        when(itemService.create(any(ItemCreateDto.class))).thenReturn(Item.builder()
                .id(itemId)
                .cleStable("peinture-acrylique-interieure")
                .name("Peinture acrylique intérieure")
                .build());

        ExtraireCreerDto out = service.creer(
                "peinture acrylique blanche", "MATIERE", "L", "peinture-acrylique-interieure");

        assertThat(out.createdSektor()).isFalse();
        assertThat(out.createdItem()).isTrue();
        assertThat(out.cleStable()).isEqualTo("peinture-acrylique-interieure");
        verify(articleRepository, never()).save(any());
        ArgumentCaptor<ItemCreateDto> itemCaptor = ArgumentCaptor.forClass(ItemCreateDto.class);
        verify(itemService).create(itemCaptor.capture());
        assertThat(itemCaptor.getValue().getCleStable()).isEqualTo("peinture-acrylique-interieure");
        assertThat(itemCaptor.getValue().getName()).isEqualTo("Peinture acrylique intérieure");
    }

    @Test
    void identiteEtItemDejaLa_neDupliquePas() {
        CatalogArticle published = CatalogArticle.builder()
                .id(UUID.randomUUID())
                .cleStable("ciment-cpj-45")
                .libelle("Ciment CPJ 45")
                .nature("MATIERE")
                .uniteCode("T")
                .statut("PUBLIE")
                .build();
        Item item = Item.builder().id(itemId).cleStable("ciment-cpj-45").name("Ciment CPJ 45").build();
        when(articleRepository.findByCleStable("ciment-cpj-45")).thenReturn(Optional.of(published));
        when(itemService.findByCleStable("ciment-cpj-45")).thenReturn(Optional.of(item));

        ExtraireCreerDto out = service.creer("Ciment CPJ 45", "MATIERE", "T", "ciment-cpj-45");

        assertThat(out.createdSektor()).isFalse();
        assertThat(out.createdItem()).isFalse();
        assertThat(out.itemId()).isEqualTo(itemId.toString());
        verify(articleRepository, never()).save(any());
        verify(itemService, never()).create(any());
    }
}
