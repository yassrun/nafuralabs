package ma.nafura.erp.etudes;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.junit.jupiter.api.Test;

class DocExtractorBordereauAdapterMapToTreeTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final DocExtractorBordereauAdapter adapter =
            new DocExtractorBordereauAdapter(null, null);

    @Test
    void mapToTree_preservesNestedSousLotsAndArticles() throws Exception {
        var data = mapper.readTree("""
                {
                  "lots": [
                    {
                      "code": "1",
                      "libelle": "TERRASSEMENT-GROS ŒUVRE",
                      "children": [
                        {
                          "code": "1-1",
                          "libelle": "Terrassement",
                          "postes": [
                            {
                              "code": "1-1-6",
                              "libelle": "SCELLEMENTS CHIMIQUES",
                              "unite": "U",
                              "quantite": 416
                            }
                          ]
                        },
                        {
                          "code": "1-2",
                          "libelle": "Assainissement",
                          "postes": [
                            {
                              "code": "1-2-1 a",
                              "libelle": "REGARD EN BÉTON : DE 40 x 40 CM",
                              "unite": "U",
                              "quantite": 10
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
                """);

        ImportTreeRequest tree = adapter.mapToTree(data);

        assertThat(tree.getArbre()).hasSize(1);
        ImportNoeudDto lot = tree.getArbre().get(0);
        assertThat(lot.getType()).isEqualTo(DpgfNoeud.TYPE_LOT);
        assertThat(lot.getCode()).isEqualTo("1");
        assertThat(lot.getEnfants()).hasSize(2);

        ImportNoeudDto sous1 = lot.getEnfants().get(0);
        assertThat(sous1.getType()).isEqualTo(DpgfNoeud.TYPE_SOUS_LOT);
        assertThat(sous1.getCode()).isEqualTo("1-1");
        assertThat(sous1.getEnfants()).hasSize(1);
        assertThat(sous1.getEnfants().get(0).getType()).isEqualTo(DpgfNoeud.TYPE_ARTICLE);
        assertThat(sous1.getEnfants().get(0).getCode()).isEqualTo("1-1-6");

        ImportNoeudDto sous2 = lot.getEnfants().get(1);
        assertThat(sous2.getType()).isEqualTo(DpgfNoeud.TYPE_SOUS_LOT);
        assertThat(sous2.getCode()).isEqualTo("1-2");
        assertThat(sous2.getEnfants().get(0).getCode()).isEqualTo("1-2-1 a");
        assertThat(sous2.getEnfants().get(0).getType()).isEqualTo(DpgfNoeud.TYPE_ARTICLE);
    }

    @Test
    void mapToTree_allowsPostesDirectlyUnderLot() throws Exception {
        var data = mapper.readTree("""
                {
                  "lots": [
                    {
                      "code": "2",
                      "libelle": "Lot direct",
                      "postes": [
                        { "code": "2-1", "libelle": "Article", "unite": "M2", "quantite": 5 }
                      ]
                    }
                  ]
                }
                """);

        ImportTreeRequest tree = adapter.mapToTree(data);
        ImportNoeudDto lot = tree.getArbre().get(0);
        assertThat(lot.getEnfants()).hasSize(1);
        assertThat(lot.getEnfants().get(0).getType()).isEqualTo(DpgfNoeud.TYPE_ARTICLE);
        assertThat(lot.getEnfants().get(0).getCode()).isEqualTo("2-1");
    }
}
