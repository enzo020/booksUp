package com.libraryGames.books;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercita a API de ponta a ponta, com transações reais. Os dados ficam no H2 entre
 * os testes, então cada teste cria registros próprios com e-mails únicos.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createsAndFetchesUser() throws Exception {
        String email = uniqueEmail();
        long id = createUser(email);

        mockMvc.perform(get("/users/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void rejectsInvalidUserWithFieldMessages() throws Exception {
        send(post("/users"), """
                {"name": "", "email": "nao-e-email"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("name")))
                .andExpect(jsonPath("$.message", containsString("email")));
    }

    @Test
    void rejectsDuplicateEmailIgnoringCase() throws Exception {
        String email = uniqueEmail();
        createUser(email);

        send(post("/users"), userJson(email.toUpperCase()))
                .andExpect(status().isConflict());
    }

    @Test
    void updateKeepsOwnEmailButRejectsAnotherUsersEmail() throws Exception {
        String email = uniqueEmail();
        String otherEmail = uniqueEmail();
        long id = createUser(email);
        createUser(otherEmail);

        send(put("/users/" + id), userJson(email)).andExpect(status().isOk());
        send(put("/users/" + id), userJson(otherEmail)).andExpect(status().isConflict());
    }

    @Test
    void returnsStandardErrorsForMissingOrInvalidIds() throws Exception {
        mockMvc.perform(get("/games/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.path").value("/games/999999"));

        mockMvc.perform(get("/games/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("id")));
    }

    @Test
    void rejectsGameWithoutTitle() throws Exception {
        send(post("/games"), """
                {"genre": "RPG", "platform": "PC", "releaseYear": 2020}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("title")));
    }

    @Test
    void createsListsAndUpdatesReview() throws Exception {
        long userId = createUser(uniqueEmail());
        long gameId = createGame();
        long reviewId = createReview(userId, gameId);

        mockMvc.perform(get("/reviews/user/" + userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].userName").value("Teste"))
                .andExpect(jsonPath("$[0].gameTitle").value("Jogo de teste"));

        mockMvc.perform(get("/reviews/game/" + gameId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        send(put("/reviews/" + reviewId), """
                {"rating": 9.5, "comment": "Terminei!", "status": "ZERADO", "hoursPlayed": 40}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ZERADO"))
                .andExpect(jsonPath("$.rating").value(9.5))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void rejectsSecondReviewForSameUserAndGame() throws Exception {
        long userId = createUser(uniqueEmail());
        long gameId = createGame();
        createReview(userId, gameId);

        send(post("/reviews"), reviewJson(userId, gameId, "8.0", "JOGANDO"))
                .andExpect(status().isConflict());
    }

    @Test
    void rejectsInvalidReviews() throws Exception {
        long userId = createUser(uniqueEmail());
        long gameId = createGame();

        send(post("/reviews"), reviewJson(userId, gameId, "11.0", "JOGANDO"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("rating")));

        send(post("/reviews"), reviewJson(userId, gameId, "8.0", "STATUS_INEXISTENTE"))
                .andExpect(status().isBadRequest());

        send(post("/reviews"), """
                {"status": "JOGANDO"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("userId")))
                .andExpect(jsonPath("$.message", containsString("gameId")));

        send(post("/reviews"), reviewJson(999999L, gameId, "8.0", "JOGANDO"))
                .andExpect(status().isNotFound());
    }

    @Test
    void listingReviewsOfUnknownUserOrGameReturnsNotFound() throws Exception {
        mockMvc.perform(get("/reviews/user/999999")).andExpect(status().isNotFound());
        mockMvc.perform(get("/reviews/game/999999")).andExpect(status().isNotFound());
    }

    @Test
    void deletingUserRemovesTheirReviews() throws Exception {
        long userId = createUser(uniqueEmail());
        long gameId = createGame();
        long reviewId = createReview(userId, gameId);

        mockMvc.perform(delete("/users/" + userId)).andExpect(status().isNoContent());

        mockMvc.perform(get("/reviews/" + reviewId)).andExpect(status().isNotFound());
        mockMvc.perform(get("/games/" + gameId)).andExpect(status().isOk());
    }

    private long createUser(String email) throws Exception {
        return idFrom(send(post("/users"), userJson(email)).andExpect(status().isCreated()));
    }

    private long createGame() throws Exception {
        return idFrom(send(post("/games"), """
                {"title": "Jogo de teste", "genre": "RPG", "platform": "PC", "releaseYear": 2020}
                """).andExpect(status().isCreated()));
    }

    private long createReview(long userId, long gameId) throws Exception {
        return idFrom(send(post("/reviews"), reviewJson(userId, gameId, "8.0", "JOGANDO"))
                .andExpect(status().isCreated()));
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String json) throws Exception {
        return mockMvc.perform(request.contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private long idFrom(ResultActions result) throws Exception {
        Number id = JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private String uniqueEmail() {
        return "teste-" + UUID.randomUUID() + "@example.com";
    }

    private String userJson(String email) {
        return """
                {"name": "Teste", "email": "%s", "bio": "Bio"}
                """.formatted(email);
    }

    private String reviewJson(long userId, long gameId, String rating, String status) {
        return """
                {"userId": %d, "gameId": %d, "rating": %s, "comment": "Bom", "status": "%s", "hoursPlayed": 10}
                """.formatted(userId, gameId, rating, status);
    }
}
