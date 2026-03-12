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
@Feature("US-06 — Edit Post")
public class EditPostTest extends TestBase {

    @ParameterizedTest(name = "{0}")
    @MethodSource("provideUpdatePostData")
    @DisplayName("verify that when updating a post, the API enforces validation, ownership, and existence rules as expected")
    @Description("Covers post update for valid, invalid, and unauthorized cases. Expected: 200 for valid, 400 for bad data, 404 for missing, 403 for others. Actual: API enforces all constraints.")
    public void verifyThatWhenUpdatingPost(Map<String, Object> data) {
        int expectedStatusCode = (int) data.get("expectedStatusCode");
        Object postId = data.get("postId");
        if (expectedStatusCode == 200 && postId.equals(1)) {
            postId = createPost("user-token", "Update Me", "Original Content");
        }
        given()
                .spec(requestSpec)
                .auth().oauth2(resolveToken("user-token"))
                .body(data)
        .when()
                .put(ApiConfig.POSTS_ENDPOINT + "/" + postId)
        .then()
                .statusCode(expectedStatusCode);
    }

    private static Stream<Arguments> provideUpdatePostData() {
        return JsonUtils.getArgumentsFromJson("/data/posts/update.json");
    }

        @Test
        @DisplayName("verify that when a user tries to update a post they do not own, the API rejects the request")
        @Description("Ensures authorship is checked. Expected: 403 Forbidden. Actual: Unauthorized access is rejected.")
        public void verifyThatWhenUpdatingPostNotOwner() {
                Long postId = createPost("user-token", "User A Post", "Content A");

        given()
                .spec(requestSpec)
                .auth().oauth2(resolveToken("admin-token")) // Admin is a different user here
                .body(Map.of("title", "Updated by B", "content", "Content B"))
        .when()
                .put(ApiConfig.POSTS_ENDPOINT + "/" + postId)
        .then()
                .statusCode(403)
                .body("error", containsStringIgnoringCase("not authorized"));
    }

    @Test
    @DisplayName("verifying that unauthenticated requests to update a post are blocked")
    @Description("Checks that the API enforces authentication on the update endpoint. " +
            "Expected Outcome: Returns 401 or 403. " +
            "Actual Result: The token filter stops the request.")
    public void verifyUpdateUnauthenticated() {
        given()
                .spec(requestSpec)
                .body(Map.of("title", "Hack", "content", "Try to edit"))
        .when()
                .put(ApiConfig.POSTS_ENDPOINT + "/1")
        .then()
                .statusCode(anyOf(is(401), is(403)));
    }
}
