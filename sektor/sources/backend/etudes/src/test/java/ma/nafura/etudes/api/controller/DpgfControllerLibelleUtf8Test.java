package ma.nafura.etudes.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import ma.nafura.etudes.config.JsonUtf8BodyFilter;
import ma.nafura.etudes.api.request.DpgfNoeudCreateDto;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.service.DpgfService;
import ma.nafura.platform.framework.api.error.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * SEKTOR-116 — POST nœud libellé accentué. Jackson lit le body en UTF-8 : un JSON
 * Windows-1252/ISO-8859-1 (é = 0xE9) lève JsonParseException → 500 INTERNAL_ERROR.
 */
class DpgfControllerLibelleUtf8Test {

    private static final Charset WINDOWS_1252 = Charset.forName("windows-1252");
    private static final UUID DPGF_ID = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    private DpgfService service;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        service = mock(DpgfService.class);
        when(service.addNoeud(eq(DPGF_ID), any(DpgfNoeudCreateDto.class))).thenAnswer(inv -> {
            DpgfNoeudCreateDto dto = inv.getArgument(1);
            return DpgfNoeud.builder()
                    .id(UUID.fromString("11111111-2222-3333-4444-555555555555"))
                    .type(dto.getType())
                    .code(dto.getCode())
                    .libelle(dto.getLibelle())
                    .ordre(0)
                    .coutDeduit(false)
                    .build();
        });
        mvc = MockMvcBuilders.standaloneSetup(new DpgfController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new JsonUtf8BodyFilter())
                .build();
    }

    @Test
    void postNoeud_windows1252LibelleBeton_returns201PersistedAsIs() throws Exception {
        byte[] body = """
                {"type":"LOT","code":"01","libelle":"Béton"}
                """
                .getBytes(WINDOWS_1252);

        mvc.perform(post("/api/v1/etudes/dpgf/{id}/noeuds", DPGF_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .characterEncoding(StandardCharsets.UTF_8)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.libelle").value("Béton"));
    }

    @Test
    void postNoeud_utf8LibelleAccents_returns201PersistedAsIs() throws Exception {
        byte[] body = """
                {"type":"LOT","code":"02","libelle":"Béton armé — déjà façadé"}
                """
                .getBytes(StandardCharsets.UTF_8);

        mvc.perform(post("/api/v1/etudes/dpgf/{id}/noeuds", DPGF_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.libelle").value("Béton armé — déjà façadé"));
    }
}
