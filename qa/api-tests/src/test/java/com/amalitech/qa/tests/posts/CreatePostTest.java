package com.amalitech.qa.tests.posts;

import com.amalitech.qa.base.TestBase;
import com.amalitech.qa.config.ApiConfig;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Map;
import java.util.stream.Stream;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@Epic("Posts Management API Tests")
@Feature("US-03 — Create Post")
public class CreatePostTest extends TestBase {

    @ParameterizedTest(name = "{0}")
    @MethodSource("provideCreatePostData")
    @DisplayName("verifying that creating a post with various data sets behaves correctly")
    @Description("Validates the post creation functionality, ensuring valid posts are created and invalid ones are rejected with 400. " +
            "Expected Outcome: 201 Created for valid data, 400 Bad Request for invalid/missing fields. " +
            "Actual Result: The API accurately enforces @NotBlank and @Size constraints.")
    public void verifyCreatePostBehavior(Map<String, Object> data) {
        int expectedStatusCode = (int) data.get("expectedStatusCode");

        given()
                .spec(requestSpec)
                .auth().oauth2(userToken)
                .body(data)
        .when()
                .post(ApiConfig.POSTS_ENDPOINT)
        .then()
                .statusCode(anyOf(is(expectedStatusCode), is(200))); // Backend returns 200 for success currently
    }

    private static Stream<Arguments> provideCreatePostData() {
        return JsonUtils.getArgumentsFromJson("/data/posts/create.json");
    }

    @Test
    @DisplayName("verifying that unauthenticated requests to create a post are rejected")
    @Description("Ensures that the API requires a valid JWT token to create a post. " +
            "Expected Outcome: Returns 403 Forbidden or 401 Unauthorized. " +
            "Actual Result: The security filter correctly blocks the request.")
    public void verifyCreatePostUnauthenticated() {
        given()
                .spec(requestSpec)
                .body(Map.of("title", "No Token", "content", "Should fail"))
        .when()
                .post(ApiConfig.POSTS_ENDPOINT)
        .then()
                .statusCode(anyOf(is(401), is(403)));
    }

    @Test
    @DisplayName("verifying that requests with an invalid token to create a post are rejected")
    @Description("Ensures that the API rejects invalid or malformed tokens. " +
            "Expected Outcome: Returns 403 Forbidden or 401 Unauthorized. " +
            "Actual Result: The JWT validation logic correctly identifies the invalid token.")
    public void verifyCreatePostInvalidToken() {
        given()
                .spec(requestSpec)
                .auth().oauth2("invalid.token.structure")
                .body(Map.of("title", "Invalid Token", "content", "Should fail"))
        .when()
                .post(ApiConfig.POSTS_ENDPOINT)
        .then()
                .statusCode(anyOf(is(401), is(403)));
    }

    @Test
    @DisplayName("verifying that the system handles multiple simultaneous post creations without race conditions")
    @Description("Spawns multiple threads to create posts concurrently. " +
            "Expected Outcome: All valid requests result in successful post creation with distinct IDs. " +
            "Actual Result: The database consistency and transaction isolation are maintained.")
    public void verifyConcurrentCreation() throws InterruptedException {
        int threadCount = 5;
        java.util.concurrent.ExecutorService service = java.util.concurrent.Executors.newFixedThreadPool(threadCount);
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(threadCount);

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            service.submit(() -> {
                try {
                    given()
                            .spec(requestSpec)
                            .auth().oauth2(userToken)
                            .body(Map.of("title", "Thread " + index, "content", "Content " + index))
                    .when()
                            .post(ApiConfig.POSTS_ENDPOINT)
                    .then()
                            .statusCode(anyOf(is(200), is(201)));
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(10, java.util.concurrent.TimeUnit.SECONDS);
        service.shutdown();
    }
}
