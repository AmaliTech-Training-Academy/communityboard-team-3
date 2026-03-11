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
@Feature("US-07 — Delete Post")
public class DeletePostTest extends TestBase {

    @ParameterizedTest(name = "{0}")
    @MethodSource("provideDeletePostData")
    @DisplayName("verifying that deleting a post is restricted to owners and handled correctly")
    @Description("Tests the DELETE /api/posts/{id} endpoint. " +
            "Expected Outcome: Returns 204 for successful deletion, 404 if post doesn't exist. " +
            "Actual Result: The system accurately processes valid deletions and rejects invalid ones.")
    public void verifyDeletePost(Map<String, Object> data) {
        int expectedStatusCode = (int) data.get("expectedStatusCode");
        Object postId = data.get("postId");

        if (expectedStatusCode == 204 && postId.equals(2)) {
            postId = createPost(userToken, "Delete Me", "Temporary content");
        }

        given()
                .spec(requestSpec)
                .auth().oauth2(userToken)
        .when()
                .delete(ApiConfig.POSTS_ENDPOINT + "/" + postId)
        .then()
                .statusCode(expectedStatusCode);
    }

    private static Stream<Arguments> provideDeletePostData() {
        return JsonUtils.getArgumentsFromJson("/data/posts/delete.json");
    }

    @Test
    @DisplayName("verifying that a post is no longer accessible after being successfully deleted")
    @Description("Confirms soft/hard deletion logic by attempting to fetch the post after deletion. " +
            "Expected Outcome: Fetching returns 404 Not Found. " +
            "Actual Result: The post is successfully removed from public view.")
    public void verifyPostInaccessibleAfterDeletion() {
        Long postId = createPost(userToken, "Deletable Post", "Will be gone soon");

        // Delete
        given()
                .spec(requestSpec)
                .auth().oauth2(userToken)
        .when()
                .delete(ApiConfig.POSTS_ENDPOINT + "/" + postId)
        .then()
                .statusCode(204);

        // Verify 404 on GET
        given()
                .spec(requestSpec)
        .when()
                .get(ApiConfig.POSTS_ENDPOINT + "/" + postId)
        .then()
                .statusCode(404);
    }

    @Test
    @DisplayName("verifying that unauthenticated requests to delete a post are rejected")
    @Description("Security check for the deletion endpoint. " +
            "Expected Outcome: Returns 401 or 403. " +
            "Actual Result: Blocked by security filters.")
    public void verifyDeleteUnauthenticated() {
        given()
                .spec(requestSpec)
        .when()
                .delete(ApiConfig.POSTS_ENDPOINT + "/1")
        .then()
                .statusCode(anyOf(is(401), is(403)));
    }
}
