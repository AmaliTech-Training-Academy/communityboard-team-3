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
    @DisplayName("verifying that updating a post is correctly authorized and validated")
    @Description("Tests the PUT /api/posts/{id} endpoint with various data and ID scenarios. " +
            "Expected Outcome: Returns 200 for valid owner updates, 400 for bad data, and 404 for missing posts. " +
            "Actual Result: The system prevents unauthorized or invalid modifications.")
    public void verifyUpdatePost(Map<String, Object> data) {
        int expectedStatusCode = (int) data.get("expectedStatusCode");
        Object postId = data.get("postId");

        if (expectedStatusCode == 200 && postId.equals(1)) {
            postId = createPost(userToken, "Update Me", "Original Content");
        }

        given()
                .spec(requestSpec)
                .auth().oauth2(userToken)
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
    @DisplayName("verifying that a user cannot update a post belonging to another user")
    @Description("Security verification ensuring that authorship is checked before allowing updates. " +
            "Expected Outcome: Returns 403 Forbidden. " +
            "Actual Result: The request is rejected as unauthorized access.")
    public void verifyUpdateForbiddenForNonOwner() {
        Long postId = createPost(userToken, "User A Post", "Content A");

        given()
                .spec(requestSpec)
                .auth().oauth2(adminToken) // Admin is a different user here
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
