package ma.nafura.platform.integrations.googleplaces;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class HttpGooglePlacesClientTest {

    private MockWebServer server;
    private HttpGooglePlacesClient client;

    @BeforeEach
    void setUp() throws Exception {
        server = new MockWebServer();
        server.start();
        GooglePlacesProperties properties = new GooglePlacesProperties();
        properties.setBaseUrl(server.url("/v1").toString());
        properties.setApiKey("test-key");
        client = new HttpGooglePlacesClient(properties, new ObjectMapper());
    }

    @AfterEach
    void tearDown() throws Exception {
        server.shutdown();
    }

    @Test
    void searchTextParsesPlaces() {
        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("""
                        {
                          "places": [
                            {
                              "id": "places/ChIJ123",
                              "displayName": { "text": "Sky 28", "languageCode": "fr" },
                              "formattedAddress": "Casablanca",
                              "location": { "latitude": 33.58, "longitude": -7.63 },
                              "types": ["bar"],
                              "primaryType": "bar",
                              "businessStatus": "OPERATIONAL"
                            }
                          ]
                        }
                        """));

        PlaceSearchResult result = client.searchText(
                new TextSearchRequest("rooftop casablanca", "MA", 33.58, -7.63, 10),
                "places.id,places.displayName"
        );

        assertEquals(1, result.places().size());
        assertEquals("places/ChIJ123", result.places().getFirst().id());
        assertNotNull(result.places().getFirst().displayName());
        assertEquals("Sky 28", result.places().getFirst().displayName().text());
    }
}
